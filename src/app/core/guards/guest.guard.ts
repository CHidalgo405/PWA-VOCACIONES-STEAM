import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    // If logged in as admin, redirect to admin dashboard
    if (authService.isAdmin()) {
      return router.createUrlTree(['/admin/dashboard']);
    }
    // If logged in as student, redirect to student dashboard
    return router.createUrlTree(['/dashboard']);
  }

  // Allow guests to view the page (login, register, forgot-password)
  return true;
};
