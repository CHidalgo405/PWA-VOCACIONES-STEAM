import { HttpInterceptorFn } from '@angular/common/http';
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
  let cloneReq = req;

  if (isApiRequest) {
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
    catchError((error) => {
      if (error.status === 401) {
        // Usamos injector para obtener AuthService de forma lazy y evitar dependencias circulares con HttpClient
        const authService = injector.get(AuthService);
        
        // Ejecutar logout completo (limpia Signals, Subjects, Theme y Storage)
        authService.logout();
        
        // Mostrar alerta al usuario y redirigir a login explícitamente
        toastService.showToast('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.', 'warning', 'Sesión Expirada');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
