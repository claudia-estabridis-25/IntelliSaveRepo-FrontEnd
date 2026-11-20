import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ClimateRecord, ClimateRefreshResult } from '../models/climate-record';

@Injectable({
  providedIn: 'root'
})
export class ClimateRecordService {
  private url = `${environment.apiUrl}/api/climate-records`;

  constructor(private http: HttpClient) {}

  listar(): Observable<ClimateRecord[]> {
    return this.http.get<ClimateRecord[]>(this.url);
  }

  consultarSede(idBranch: number): Observable<ClimateRecord> {
    return this.http.post<ClimateRecord>(`${this.url}/branch/${idBranch}/fetch`, {});
  }

  actualizarTodas(): Observable<ClimateRefreshResult> {
    return this.http.post<ClimateRefreshResult>(`${this.url}/refresh`, {});
  }
}
