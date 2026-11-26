import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Tariff, TariffInsert } from '../models/tariff';

@Injectable({
  providedIn: 'root'
})
export class TariffService {
  private url = `${environment.apiUrl}/api/tariffs`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Tariff[]> {
    return this.http.get<Tariff[]>(this.url);
  }

  listarPorId(id: number): Observable<Tariff> {
    return this.http.get<Tariff>(`${this.url}/${id}`);
  }

  registrar(tarifa: TariffInsert): Observable<Tariff> {
    return this.http.post<Tariff>(this.url, tarifa);
  }

  modificar(tarifa: TariffInsert): Observable<Tariff> {
    return this.http.put<Tariff>(this.url, tarifa);
  }
}
