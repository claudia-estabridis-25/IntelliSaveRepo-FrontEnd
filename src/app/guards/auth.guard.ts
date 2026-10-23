import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from '../services/login.service';

export const authGuard: CanActivateFn = () => {
  const loginService = inject(LoginService);
  const router = inject(Router);

  if (loginService.estaAutenticado()) {
    return true;
  }

  loginService.limpiarSesion();
  return router.createUrlTree(['/login']);
};