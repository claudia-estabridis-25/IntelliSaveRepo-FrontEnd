import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CarbonFootprint, CarbonFootprintInsert } from '../models/carbon-footprint';

@Injectable({
  providedIn: 'root'
})
export class CarbonFootprintService {
  private url = `${environment.apiUrl}/api/carbon-footprints`;

  constructor(private http: HttpClient) {}

  listar(): Observable<CarbonFootprint[]> {
    return this.http.get<CarbonFootprint[]>(this.url);
  }

  listarPorId(id: number): Observable<CarbonFootprint> {
    return this.http.get<CarbonFootprint>(`${this.url}/${id}`);
  }

  registrar(huella: CarbonFootprintInsert): Observable<CarbonFootprint> {
    return this.http.post<CarbonFootprint>(this.url, huella);
  }

  calcularTodas(periodo: string, factor: number, fecha: string | null): Observable<CarbonFootprint[]> {
    const params: Record<string, string> = { timePeriod: periodo, emissionFactor: String(factor) };
    if (fecha) {
      params['calculationDate'] = fecha;
    }
    return this.http.post<CarbonFootprint[]>(`${this.url}/calculate-all`, {}, { params });
  }

  modificar(huella: CarbonFootprintInsert): Observable<CarbonFootprint> {
    return this.http.put<CarbonFootprint>(this.url, huella);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
