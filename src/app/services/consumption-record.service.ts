import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ConsumptionRecord, ConsumptionRecordInsert } from '../models/consumption-record';

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
}
