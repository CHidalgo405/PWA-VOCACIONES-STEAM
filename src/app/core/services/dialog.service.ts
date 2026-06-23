import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface DialogRequest {
  title: string;
  message: string;
  type: 'confirm' | 'alert';
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  resolve: (value: boolean) => void;
}

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  private dialogSubject = new Subject<DialogRequest>();
  dialog$ = this.dialogSubject.asObservable();

  /**
   * Muestra un diálogo de confirmación.
   * @returns Promesa que resuelve a `true` si se confirma, o `false` si se cancela.
   */
  confirm(
    title: string,
    message: string,
    options?: { confirmText?: string; cancelText?: string; isDanger?: boolean }
  ): Promise<boolean> {
    return new Promise((resolve) => {
      this.dialogSubject.next({
        title,
        message,
        type: 'confirm',
        confirmText: options?.confirmText || 'Confirmar',
        cancelText: options?.cancelText || 'Cancelar',
        isDanger: options?.isDanger || false,
        resolve
      });
    });
  }

  /**
   * Muestra un diálogo de alerta (solo botón de aceptar).
   * @returns Promesa que resuelve a `true` cuando se cierra la alerta.
   */
  alert(
    title: string,
    message: string,
    options?: { confirmText?: string; isDanger?: boolean }
  ): Promise<boolean> {
    return new Promise((resolve) => {
      this.dialogSubject.next({
        title,
        message,
        type: 'alert',
        confirmText: options?.confirmText || 'Aceptar',
        isDanger: options?.isDanger || false,
        resolve
      });
    });
  }
}
