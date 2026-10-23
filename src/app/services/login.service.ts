import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
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

  constructor(private http: HttpClient, private router: Router) {}

  login(datos: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/login`, datos);
  }

  obtenerPerfil(): Observable<Usuario> {
    return this.http.get<Usuario>(`${environment.apiUrl}/api/users/me`);
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
    localStorage.removeItem(this.claveToken);
    localStorage.removeItem(this.claveUsuario);
    sessionStorage.removeItem(this.claveToken);
    sessionStorage.removeItem(this.claveUsuario);
  }

  cerrarSesion(): void {
    this.limpiarSesion();
    this.router.navigate(['/login']);
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