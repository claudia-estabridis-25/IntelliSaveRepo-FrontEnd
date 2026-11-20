import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ConsumptionReport } from '../models/report';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private url = `${environment.apiUrl}/api/reports/consumption`;

  constructor(private http: HttpClient) {}

  obtener(desde: string, hasta: string, idBranch: number | null): Observable<ConsumptionReport> {
    return this.http.get<ConsumptionReport>(this.url, { params: this.parametros(desde, hasta, idBranch) });
  }

  descargarPdf(desde: string, hasta: string, idBranch: number | null): Observable<Blob> {
    return this.http.get(`${this.url}/pdf`, { params: this.parametros(desde, hasta, idBranch), responseType: 'blob' });
  }

  descargarCsv(desde: string, hasta: string, idBranch: number | null): Observable<Blob> {
    return this.http.get(`${this.url}/csv`, { params: this.parametros(desde, hasta, idBranch), responseType: 'blob' });
  }

  guardarArchivo(archivo: Blob, nombre: string): void {
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(archivo);
    enlace.download = nombre;
    enlace.click();
    URL.revokeObjectURL(enlace.href);
  }

  private parametros(desde: string, hasta: string, idBranch: number | null): HttpParams {
    let params = new HttpParams()
      .set('desde', `${desde}T00:00:00`)
      .set('hasta', `${hasta}T23:59:59`);
    if (idBranch) {
      params = params.set('idBranch', idBranch);
    }
    return params;
  }
}
