import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from '../services/login.service';

export const rolGuard: CanActivateFn = route => {
  const loginService = inject(LoginService);
  const router = inject(Router);
  const permitidos: string[] = route.data['roles'] ?? [];

  if (permitidos.length === 0 || permitidos.some(rol => loginService.tieneRol(rol))) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};