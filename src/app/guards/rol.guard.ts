import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { LoginService } from '../services/login.service';

// HU091 CA02: si el usuario entra por URL a una opción que no le corresponde, vuelve al dashboard.
export const rolGuard: CanActivateFn = route => {
  const loginService = inject(LoginService);
  const router = inject(Router);
  const permitidos: string[] = route.data['roles'] ?? [];
  const dashboard = router.createUrlTree(['/dashboard']);

  // ADMIN_PLATAFORMA y ADMIN_EMPRESA dependen del perfil (el JWT no trae la empresa).
  if (permitidos.some(rol => rol.startsWith('ADMIN_'))) {
    return loginService.perfilActual().pipe(
      map(perfil => (loginService.puedeAcceder(permitidos, perfil) ? true : dashboard))
    );
  }

  return loginService.puedeAcceder(permitidos, null) ? true : dashboard;
};
