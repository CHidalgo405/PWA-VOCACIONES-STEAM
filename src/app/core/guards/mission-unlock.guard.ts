import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const missionUnlockGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.getCurrentUser();

  if (user && user.id) {
    const hasTakenTest = localStorage.getItem(`hasTakenTest_${user.id}`);
    if (hasTakenTest === 'true') {
      return true;
    }
  }

  // Not authorized (Mission 1 not completed), redirect to dashboard
  return router.createUrlTree(['/dashboard']);
};
