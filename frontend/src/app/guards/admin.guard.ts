import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../features/auth/services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const role = authService.getRole();

  if (role === 'ROLE_ADMIN' || role === 'ADMIN') {
    return true;
  }

  return router.createUrlTree(['/404']);
};
