import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Branch, BranchInsert } from '../models/branch';
import { ConsumoSede } from '../models/estadisticas';

@Injectable({
  providedIn: 'root'
})
export class BranchService {
  private url = `${environment.apiUrl}/api/branches`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Branch[]> {
    return this.http.get<Branch[]>(this.url);
  }

  listarPorId(id: number): Observable<BranchInsert> {
    return this.http.get<BranchInsert>(`${this.url}/${id}`);
  }

  registrar(sede: BranchInsert): Observable<BranchInsert> {
    return this.http.post<BranchInsert>(this.url, sede);
  }

  modificar(sede: BranchInsert): Observable<BranchInsert> {
    return this.http.put<BranchInsert>(this.url, sede);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  // HU156: consumo y costo por sede de una empresa.
  consumoPorSede(idCompany: number): Observable<ConsumoSede[]> {
    return this.http.get<ConsumoSede[]>(`${this.url}/company/consumption/${idCompany}`);
  }
}
