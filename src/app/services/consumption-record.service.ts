import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ConsumptionRecord, ConsumptionRecordInsert } from '../models/consumption-record';
import { ConsumoCategoria, ConsumoElevado } from '../models/estadisticas';

@Injectable({
  providedIn: 'root'
})
export class ConsumptionRecordService {
  private url = `${environment.apiUrl}/api/consumption-records`;

  constructor(private http: HttpClient) {}

  listar(): Observable<ConsumptionRecord[]> {
    return this.http.get<ConsumptionRecord[]>(this.url);
  }

  listarPorId(id: number): Observable<ConsumptionRecord> {
    return this.http.get<ConsumptionRecord>(`${this.url}/${id}`);
  }

  registrar(registro: ConsumptionRecordInsert): Observable<ConsumptionRecord> {
    return this.http.post<ConsumptionRecord>(this.url, registro);
  }

  modificar(registro: ConsumptionRecordInsert): Observable<ConsumptionRecord> {
    return this.http.put<ConsumptionRecord>(this.url, registro);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  // HU100: historial con filtros opcionales. desde/hasta en formato yyyy-MM-ddTHH:mm:ss.
  historial(filtros: { idBranch?: number | null; idDepartment?: number | null; idEquipment?: number | null; desde?: string | null; hasta?: string | null }): Observable<ConsumptionRecord[]> {
    let params = new HttpParams();
    for (const [clave, valor] of Object.entries(filtros)) {
      if (valor !== null && valor !== undefined && valor !== '' && valor !== 0) {
        params = params.set(clave, String(valor));
      }
    }
    return this.http.get<ConsumptionRecord[]>(`${this.url}/history`, { params });
  }

  // HU042: equipos con consumo elevado de un área (404 si el área no tiene consumos).
  consumoElevado(idDepartment: number): Observable<ConsumoElevado[]> {
    return this.http.get<ConsumoElevado[]>(`${this.url}/department/${idDepartment}/elevated-consumption`);
  }

    consumoPorCategoria(desde: string, hasta: string): Observable<ConsumoCategoria[]> {
    const params = new HttpParams()
      .set('desde', `${desde}T00:00:00`)
      .set('hasta', `${hasta}T23:59:59`);
    return this.http.get<ConsumoCategoria[]>(`${this.url}/by-category`, { params });
  }
}
