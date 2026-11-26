import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../environments/environment';
import { LoginRequest } from '../models/login-request';
import { LoginResponse } from '../models/login-response';
import { TokenPayload } from '../models/token-payload';
import { Usuario } from '../models/usuario';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private claveToken = 'token';
  private claveUsuario = 'username';
  private perfil$: Observable<Usuario | null> | null = null;

  constructor(private http: HttpClient, private router: Router) {}

  login(datos: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/login`, datos);
  }

  obtenerPerfil(): Observable<Usuario> {
    return this.http.get<Usuario>(`${environment.apiUrl}/api/users/me`);
  }

  // Perfil del usuario en sesión, pedido una sola vez y compartido por el menú, los guards y las pantallas.
  // Se necesita porque el JWT solo trae los roles: el nivel de administrador sale de idCompany.
  perfilActual(): Observable<Usuario | null> {
    if (!this.perfil$) {
      this.perfil$ = this.obtenerPerfil().pipe(
        catchError(() => of(null)),
        shareReplay(1)
      );
    }
    return this.perfil$;
  }

  // ADMIN sin empresa = administrador de la plataforma; ADMIN con empresa = administrador de la empresa (HU091)
  esAdminPlataforma(perfil: Usuario | null): boolean {
    return this.tieneRol('ADMIN') && !!perfil && perfil.idCompany === null;
  }

  esAdminEmpresa(perfil: Usuario | null): boolean {
    return this.tieneRol('ADMIN') && !!perfil && perfil.idCompany !== null;
  }

  // Además de ADMIN, SUPERVISOR y EMPLOYEE acepta ADMIN_PLATAFORMA y ADMIN_EMPRESA.
  puedeAcceder(roles: string[], perfil: Usuario | null): boolean {
    return roles.length === 0 || roles.some(rol => {
      if (rol === 'ADMIN_PLATAFORMA') {
        return this.esAdminPlataforma(perfil);
      }
      if (rol === 'ADMIN_EMPRESA') {
        return this.esAdminEmpresa(perfil);
      }
      return this.tieneRol(rol);
    });
  }

  nombreRol(perfil: Usuario | null): string {
    if (this.esAdminPlataforma(perfil)) {
      return 'Administrador de la plataforma';
    }
    if (this.tieneRol('ADMIN')) {
      return 'Administrador de empresa';
    }
    if (this.tieneRol('SUPERVISOR')) {
      return 'Supervisor energético';
    }
    return 'Empleado de área';
  }

  guardarSesion(respuesta: LoginResponse, recordar: boolean): void {
    this.limpiarSesion();
    const almacenamiento = recordar ? localStorage : sessionStorage;
    almacenamiento.setItem(this.claveToken, respuesta.token);
    almacenamiento.setItem(this.claveUsuario, respuesta.username);
  }

  obtenerToken(): string | null {
    return localStorage.getItem(this.claveToken) ?? sessionStorage.getItem(this.claveToken);
  }

  obtenerUsuario(): string {
    return localStorage.getItem(this.claveUsuario) ?? sessionStorage.getItem(this.claveUsuario) ?? '';
  }

  estaAutenticado(): boolean {
    const datos = this.decodificarToken();
    return !!datos && datos.exp * 1000 > Date.now();
  }

  obtenerRoles(): string[] {
    const datos = this.decodificarToken();
    if (!datos || !datos.roles) {
      return [];
    }
    return datos.roles.split(',').map(rol => rol.trim());
  }

  tieneRol(rol: string): boolean {
    return this.obtenerRoles().includes(`ROLE_${rol}`);
  }

  limpiarSesion(): void {
    this.perfil$ = null;
    localStorage.removeItem(this.claveToken);
    localStorage.removeItem(this.claveUsuario);
    sessionStorage.removeItem(this.claveToken);
    sessionStorage.removeItem(this.claveUsuario);
  }

  cerrarSesion(): void {
    this.limpiarSesion();
    this.router.navigate(['/']); //Para volver a la landing page después de cerrar sesión
  }

  private decodificarToken(): TokenPayload | null {
    const token = this.obtenerToken();
    if (!token) {
      return null;
    }
    try {
      return jwtDecode<TokenPayload>(token);
    } catch {
      return null;
    }
  }
}