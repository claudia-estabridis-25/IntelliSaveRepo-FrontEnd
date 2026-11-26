import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { LoginService } from '../services/login.service';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Solo las peticiones a nuestra API llevan el token; las APIs externas (p. ej. Nominatim) no.
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const loginService = inject(LoginService);
  const router = inject(Router);
  const token = loginService.obtenerToken();
  const esLogin = req.url.endsWith('/login');

  const peticion = token && !esLogin
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(peticion).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !esLogin) {
        loginService.limpiarSesion();
        router.navigate(['/login'], { queryParams: { expirada: true } });
      }
      return throwError(() => error);
    })
  );
};
