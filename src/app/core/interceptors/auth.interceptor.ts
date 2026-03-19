import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
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
        localStorage.removeItem('steam_pwa_token');
        localStorage.removeItem('steam_pwa_user');
        sessionStorage.removeItem('steam_pwa_user');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
