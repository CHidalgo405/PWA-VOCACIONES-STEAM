import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const injector = inject(Injector);
  const toastService = inject(ToastService);
  const token = localStorage.getItem('steam_pwa_token');

  const isApiRequest = req.url.startsWith('/api/') || req.url.startsWith(environment.apiUrl);

  // Helper compartido para cerrar la sesión de forma consistente (expiración
  // detectada en cliente o 401 del servidor).
  const handleSessionExpired = () => {
    const authService = injector.get(AuthService);
    authService.clearSession();
    toastService.showToast('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.', 'warning', 'Sesión Expirada');
    router.navigate(['/login']);
  };

  let cloneReq = req;

  if (isApiRequest) {
    const authService = injector.get(AuthService);

    // Verificación PROACTIVA: si el token ya expiró, no enviamos una petición
    // condenada (que podría volver como error de red/CORS y dejar la app
    // atascada en "Error de conexión"). Cerramos sesión limpiamente.
    if (token && authService.isTokenExpired(token)) {
      handleSessionExpired();
      return throwError(() => new HttpErrorResponse({
        status: 401,
        statusText: 'Token expired (client-side)',
        url: req.url
      }));
    }

    const isFullUrl = req.url.startsWith('http');
    const finalUrl = isFullUrl ? req.url : `${environment.apiUrl}${req.url.replace('/api/v1', '')}`;

    let headers = req.headers;
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    cloneReq = req.clone({
      url: finalUrl,
      headers
    });
  }

  return next(cloneReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Reactivo: el servidor rechazó el token (fallback si la verificación
      // proactiva no aplicó, p.ej. token revocado antes de expirar).
      if (error.status === 401 && isApiRequest) {
        handleSessionExpired();
      }
      return throwError(() => error);
    })
  );
};
