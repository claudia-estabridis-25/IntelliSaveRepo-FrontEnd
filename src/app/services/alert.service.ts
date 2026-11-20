import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Alert, AlertInsert } from '../models/alert';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private url = `${environment.apiUrl}/api/alerts`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Alert[]> {
    return this.http.get<Alert[]>(this.url);
  }

  listarPorId(id: number): Observable<Alert> {
    return this.http.get<Alert>(`${this.url}/${id}`);
  }

  registrar(alerta: AlertInsert): Observable<Alert> {
    return this.http.post<Alert>(this.url, alerta);
  }

  modificar(alerta: AlertInsert): Observable<Alert> {
    return this.http.put<Alert>(this.url, alerta);
  }

  cambiarEstado(id: number, estado: string): Observable<Alert> {
    return this.http.patch<Alert>(`${this.url}/${id}/status`, {}, { params: { status: estado } });
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
