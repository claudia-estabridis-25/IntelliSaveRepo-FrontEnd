import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PerfilUpdate, Usuario, UsuarioInsert } from '../models/usuario';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private url = `${environment.apiUrl}/api/users`;

  private rutasPorRol: Record<string, string> = {
    ROLE_ADMIN: 'admins',
    ROLE_SUPERVISOR: 'supervisors',
    ROLE_EMPLOYEE: 'employees'
  };

  constructor(private http: HttpClient) {}

  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.url);
  }

  listarPorId(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.url}/${id}`);
  }

  registrar(usuario: UsuarioInsert, rol: string): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.url}/${this.rutasPorRol[rol]}`, usuario);
  }

  modificar(usuario: UsuarioInsert): Observable<Usuario> {
    return this.http.put<Usuario>(this.url, usuario);
  }

  desactivar(id: number): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.url}/${id}/deactivate`, {});
  }

  miPerfil(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.url}/me`);
  }

  editarMiPerfil(datos: PerfilUpdate): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.url}/me`, datos);
  }
}
