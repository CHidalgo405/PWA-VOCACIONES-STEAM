import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import {
  Observable,
  Subject,
  catchError,
  finalize,
  firstValueFrom,
  tap,
  throwError,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';

export type OfflineOperationType = 'profile' | 'calibration' | 'simulator';

interface OfflineOperation {
  id: string;
  userId: string;
  type: OfflineOperationType;
  endpoint: string;
  payload: Record<string, unknown>;
  createdAt: string;
  attempts: number;
  nextAttemptAt: number;
}

export interface OfflineSyncResult {
  type: OfflineOperationType;
  response: unknown;
}

/**
 * Outbox durable para resultados que deben llegar a PostgreSQL. La operación
 * se guarda antes del primer HTTP y conserva el mismo clientSubmissionId en
 * cada reintento, por lo que una respuesta perdida no duplica registros.
 */
@Injectable({ providedIn: 'root' })
export class OfflineSyncService {
  private readonly storagePrefix = 'steam_offline_sync_queue';
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly syncedSubject = new Subject<OfflineSyncResult>();
  private readonly inFlightIds = new Set<string>();
  private retryTimer: number | null = null;
  private flushInProgress = false;

  readonly synced$ = this.syncedSubject.asObservable();
  readonly pendingCount = signal(0);

  private readonly onlineListener = () => void this.flushPending();

  constructor() {
    window.addEventListener('online', this.onlineListener);
    this.authService.currentUser$.subscribe((user) => {
      this.refreshPendingCount();
      if (user?.id && navigator.onLine)
        queueMicrotask(() => this.flushPending());
    });
  }

  /**
   * Registra primero la operación y después intenta enviarla. Si el error es
   * transitorio, la entrada permanece en la cola y el caller puede mostrar su
   * resultado local de inmediato.
   */
  submit<T>(
    type: OfflineOperationType,
    endpoint: string,
    payload: Record<string, unknown>,
  ): Observable<T> {
    const userId = this.authService.getCurrentUser()?.id;
    if (!userId) {
      return throwError(
        () => new Error('No hay una sesión activa para sincronizar.'),
      );
    }

    const operation: OfflineOperation = {
      id: this.createId(),
      userId,
      type,
      endpoint,
      payload,
      createdAt: new Date().toISOString(),
      attempts: 0,
      nextAttemptAt: 0,
    };
    this.upsert(operation);
    this.inFlightIds.add(operation.id);

    return this.http
      .post<T>(`${environment.apiUrl}${endpoint}`, this.requestBody(operation))
      .pipe(
        tap((response) => {
          this.remove(operation.id, userId);
          this.syncedSubject.next({ type, response });
        }),
        catchError((error: HttpErrorResponse) => {
          if (this.isRetryable(error)) {
            this.markFailed(operation, error);
            this.scheduleRetry();
          } else {
            this.remove(operation.id, userId);
          }
          return throwError(() => error);
        }),
        finalize(() => {
          this.inFlightIds.delete(operation.id);
          this.scheduleRetry();
        }),
      );
  }

  async flushPending(): Promise<void> {
    const userId = this.authService.getCurrentUser()?.id;
    if (!userId || !navigator.onLine || this.flushInProgress) return;

    const due = this.read(userId).filter(
      (operation) =>
        operation.nextAttemptAt <= Date.now() &&
        !this.inFlightIds.has(operation.id),
    );
    if (!due.length) {
      this.scheduleRetry();
      return;
    }

    this.flushInProgress = true;
    let synced = 0;
    let rejected = 0;
    try {
      for (const operation of due) {
        this.inFlightIds.add(operation.id);
        try {
          const response = await firstValueFrom(
            this.http.post(
              `${environment.apiUrl}${operation.endpoint}`,
              this.requestBody(operation),
            ),
          );
          this.remove(operation.id, userId);
          this.syncedSubject.next({ type: operation.type, response });
          synced++;
        } catch (error) {
          if (this.isRetryable(error)) {
            this.markFailed(operation, error);
          } else {
            this.remove(operation.id, userId);
            rejected++;
          }
        } finally {
          this.inFlightIds.delete(operation.id);
        }
      }
    } finally {
      this.flushInProgress = false;
      this.refreshPendingCount();
      this.scheduleRetry();
    }

    if (synced > 0) {
      this.toastService.showToast(
        `${synced} resultado${synced === 1 ? '' : 's'} sincronizado${synced === 1 ? '' : 's'} con tu cuenta.`,
        'success',
        'Sincronización completada',
      );
    }
    if (rejected > 0) {
      this.toastService.showToast(
        'Un resultado guardado no pudo sincronizarse porque el servidor rechazó sus datos.',
        'error',
        'Sincronización pendiente',
      );
    }
  }

  private requestBody(operation: OfflineOperation): Record<string, unknown> {
    return { ...operation.payload, clientSubmissionId: operation.id };
  }

  private isRetryable(error: unknown): boolean {
    if (!(error instanceof HttpErrorResponse)) return true;
    return (
      error.status === 0 ||
      error.status === 401 ||
      error.status === 408 ||
      error.status === 425 ||
      error.status === 429 ||
      error.status >= 500
    );
  }

  private markFailed(operation: OfflineOperation, error: unknown): void {
    const attempts = operation.attempts + 1;
    const online = navigator.onLine;
    const delay = online
      ? Math.min(5_000 * 2 ** Math.min(attempts - 1, 5), 300_000)
      : 0;
    this.upsert({
      ...operation,
      attempts,
      nextAttemptAt: online ? Date.now() + delay : 0,
    });
    if (error instanceof HttpErrorResponse && error.status === 401) {
      // Se conserva hasta que la sesión pueda renovarse o el usuario vuelva a entrar.
      return;
    }
  }

  private scheduleRetry(): void {
    if (this.retryTimer !== null) window.clearTimeout(this.retryTimer);
    this.retryTimer = null;
    const userId = this.authService.getCurrentUser()?.id;
    if (!userId || !navigator.onLine) return;
    const operations = this.read(userId).filter(
      (operation) => !this.inFlightIds.has(operation.id),
    );
    if (!operations.length) return;
    const earliest = Math.min(
      ...operations.map((operation) => operation.nextAttemptAt),
    );
    const delay = Math.max(0, earliest - Date.now());
    this.retryTimer = window.setTimeout(() => void this.flushPending(), delay);
  }

  private storageKey(userId: string): string {
    return `${this.storagePrefix}_${userId}`;
  }

  private read(userId: string): OfflineOperation[] {
    try {
      const parsed = JSON.parse(
        localStorage.getItem(this.storageKey(userId)) || '[]',
      );
      return Array.isArray(parsed)
        ? parsed.filter(
            (item): item is OfflineOperation =>
              !!item &&
              typeof item.id === 'string' &&
              item.userId === userId &&
              typeof item.endpoint === 'string',
          )
        : [];
    } catch {
      return [];
    }
  }

  private upsert(operation: OfflineOperation): void {
    const operations = this.read(operation.userId);
    const index = operations.findIndex((item) => item.id === operation.id);
    if (index >= 0) operations[index] = operation;
    else operations.push(operation);
    try {
      localStorage.setItem(
        this.storageKey(operation.userId),
        JSON.stringify(operations),
      );
    } catch {
      // La petición inmediata todavía puede completar aunque el storage esté lleno.
    }
    this.refreshPendingCount();
  }

  private remove(id: string, userId: string): void {
    const remaining = this.read(userId).filter(
      (operation) => operation.id !== id,
    );
    try {
      if (remaining.length) {
        localStorage.setItem(
          this.storageKey(userId),
          JSON.stringify(remaining),
        );
      } else {
        localStorage.removeItem(this.storageKey(userId));
      }
    } catch {
      // No hay acción recuperable si el navegador bloquea localStorage.
    }
    this.refreshPendingCount();
  }

  private refreshPendingCount(): void {
    const userId = this.authService.getCurrentUser()?.id;
    this.pendingCount.set(userId ? this.read(userId).length : 0);
  }

  private createId(): string {
    if (
      typeof crypto !== 'undefined' &&
      typeof crypto.randomUUID === 'function'
    ) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
      const random = Math.floor(Math.random() * 16);
      const value = char === 'x' ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    });
  }
}
