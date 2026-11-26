import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { Department } from '../models/department';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private url = `${environment.apiUrl}/api/departments`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Department[]> {
    return this.http.get<Department[]>(this.url);
  }

  // HU121: áreas de una sede. El backend responde 404 cuando la sede no tiene áreas; aquí eso es una lista vacía.
  listarPorSede(idBranch: number): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.url}/branch/${idBranch}`).pipe(
      catchError((err: HttpErrorResponse) => (err.status === 404 ? of([]) : throwError(() => err)))
    );
  }

  // HU121: búsqueda de áreas por nombre (el backend ya limita el resultado a la empresa del usuario).
  buscarPorNombre(nombre: string): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.url}/search-by-name`, { params: { name: nombre } });
  }

  listarPorId(id: number): Observable<Department> {
    return this.http.get<Department>(`${this.url}/${id}`);
  }

  registrar(area: Department): Observable<Department> {
    return this.http.post<Department>(this.url, area);
  }

  modificar(area: Department): Observable<Department> {
    return this.http.put<Department>(this.url, area);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
