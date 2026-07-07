import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map, catchError, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { VocationTestService } from '../services/test.service';

export const missionUnlockGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const testService = inject(VocationTestService);
  const router = inject(Router);
  const user = authService.getCurrentUser();

  if (!user?.id) {
    return router.createUrlTree(['/dashboard']);
  }

  const hasTakenTest = localStorage.getItem(`hasTakenTest_${user.id}`);
  if (hasTakenTest === 'true') {
    return true;
  }

  // Bandera local ausente (dispositivo nuevo, storage borrado, PWA
  // reinstalada, etc.): antes de bloquear verificamos contra la BD, ya que
  // el test principal se persiste ahí y sobrevive cambios de dispositivo
  // (dashboard.component.ts ya usa este mismo criterio vía getLatestTest()).
  return testService.getLatestTest().pipe(
    map((latestTest) => {
      if (latestTest) {
        localStorage.setItem(`hasTakenTest_${user.id}`, 'true');
        return true;
      }
      return router.createUrlTree(['/dashboard']);
    }),
    catchError(() => of(router.createUrlTree(['/dashboard']))),
  );
};
