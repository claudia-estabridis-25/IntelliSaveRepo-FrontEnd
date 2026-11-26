import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Alert, AlertInsert } from '../models/alert';
import { ConteoAlertas } from '../models/estadisticas';

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

  // HU142 CA02: historial de alertas atendidas o descartadas. desde/hasta en formato yyyy-MM-ddTHH:mm:ss.
  historial(tipo: string | null, desde: string | null, hasta: string | null): Observable<Alert[]> {
    let params = new HttpParams();
    if (tipo) params = params.set('type', tipo);
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return this.http.get<Alert[]>(`${this.url}/history`, { params });
  }

  // HU145: genera las alertas de consumo anormal de un área (rango opcional).
  generarDeArea(idDepartment: number, desde: string | null, hasta: string | null): Observable<Alert[]> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return this.http.post<Alert[]>(`${this.url}/department/${idDepartment}/generate`, {}, { params });
  }

  contarPorEstado(): Observable<ConteoAlertas[]> {
    return this.http.get<ConteoAlertas[]>(`${this.url}/count-by-status`);
  }

  contarPorPrioridad(): Observable<ConteoAlertas[]> {
    return this.http.get<ConteoAlertas[]>(`${this.url}/count-by-priority`);
  }
}
