import { HttpInterceptorFn, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

/**
 * Lock de refresco: evita que múltiples peticiones que expiran al mismo tiempo
 * lancen N llamadas simultáneas a /auth/refresh (race condition).
 *
 * - `isRefreshing` bloquea peticiones adicionales mientras ya hay un refresh en vuelo.
 * - `pendingRefresh$` emite el nuevo accessToken cuando el refresh termina, permitiendo
 *   que las peticiones en espera se retransmitan con el token actualizado.
 */
let isRefreshing = false;
const pendingRefresh$ = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router    = inject(Router);
  const injector  = inject(Injector);
  const toast     = inject(ToastService);
  const authSvc   = injector.get(AuthService);

  const isApiReq     = req.url.startsWith('/api/') || req.url.startsWith(environment.apiUrl);
  const isRefreshReq = req.url.includes('/auth/refresh');

  // Peticiones no-API o la propia llamada al refresh: pasan sin modificación
  if (!isApiReq || isRefreshReq) return next(req);

  // Normaliza la URL (relativa → absoluta)
  const isAbsolute   = req.url.startsWith('http');
  const finalUrl     = isAbsolute ? req.url : `${environment.apiUrl}${req.url.replace('/api/v1', '')}`;
  const normalizedReq = req.clone({ url: finalUrl });

  // ── Helpers ──────────────────────────────────────────────────────────────

  const withBearer = (r: HttpRequest<unknown>, token: string) =>
    r.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

  /** Cierra sesión definitivamente mostrando aviso al usuario. */
  const forceLogout = () => {
    authSvc.clearSession();
    toast.showToast(
      'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.',
      'warning',
      'Sesión Expirada'
    );
    router.navigate(['/login']);
  };

  /**
   * Refresca el access token y retransmite `originalReq` con el nuevo token.
   * Si ya hay un refresh en vuelo, encola la petición hasta que se resuelva.
   */
  const refreshAndRetry = (originalReq: HttpRequest<unknown>) => {
    if (!isRefreshing) {
      isRefreshing = true;
      pendingRefresh$.next(null);

      return authSvc.refreshAccessToken().pipe(
        switchMap(({ accessToken }) => {
          isRefreshing = false;
          pendingRefresh$.next(accessToken);
          return next(withBearer(originalReq, accessToken));
        }),
        catchError(err => {
          isRefreshing = false;
          pendingRefresh$.next(null);
          forceLogout();
          return throwError(() => err);
        })
      );
    }

    // Hay un refresh en vuelo: esperar al nuevo token y reintentar
    return pendingRefresh$.pipe(
      filter((token): token is string => token !== null),
      take(1),
      switchMap(token => next(withBearer(originalReq, token)))
    );
  };

  // ── Lógica principal ─────────────────────────────────────────────────────

  const accessToken = localStorage.getItem('steam_pwa_token');

  /**
   * VERIFICACIÓN PROACTIVA: si el access token ya expiró antes de enviar,
   * intentamos renovar silenciosamente en lugar de enviar una petición
   * condenada que puede volver como error de red/CORS.
   */
  if (accessToken && authSvc.isTokenExpired(accessToken)) {
    const refreshToken = authSvc.getRefreshToken();
    if (!refreshToken || authSvc.isTokenExpired(refreshToken)) {
      // Ambos tokens muertos → logout inmediato
      forceLogout();
      return throwError(() => new HttpErrorResponse({ status: 401, url: req.url }));
    }
    // Renovar antes de enviar
    return refreshAndRetry(normalizedReq);
  }

  // Token válido (o sin token para endpoints públicos): adjuntar y enviar
  const outReq = accessToken ? withBearer(normalizedReq, accessToken) : normalizedReq;

  return next(outReq).pipe(
    catchError((error: HttpErrorResponse) => {
      /**
       * VERIFICACIÓN REACTIVA: el servidor rechazó el token (p. ej. token
       * revocado antes de expirar, o reloj del servidor ligeramente distinto).
       * Intentamos renovar; si falla → logout.
       */
      if (error.status === 401) {
        const refreshToken = authSvc.getRefreshToken();
        if (refreshToken && !authSvc.isTokenExpired(refreshToken)) {
          return refreshAndRetry(normalizedReq);
        }
        forceLogout();
      }
      return throwError(() => error);
    })
  );
};
