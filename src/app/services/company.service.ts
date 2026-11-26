import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Company, CompanyInsert } from '../models/company';
import { ConteoSector } from '../models/estadisticas';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private url = `${environment.apiUrl}/api/companies`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Company[]> {
    return this.http.get<Company[]>(this.url);
  }

  listarPorId(id: number): Observable<CompanyInsert> {
    return this.http.get<CompanyInsert>(`${this.url}/${id}`);
  }

  registrar(empresa: CompanyInsert): Observable<CompanyInsert> {
    return this.http.post<CompanyInsert>(this.url, empresa);
  }

  modificar(empresa: CompanyInsert): Observable<CompanyInsert> {
    return this.http.put<CompanyInsert>(this.url, empresa);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  // HU042: cantidad de empresas por sector (dashboard del administrador de la plataforma).
  contarPorSector(): Observable<ConteoSector[]> {
    return this.http.get<ConteoSector[]>(`${this.url}/count-by-sector`);
  }
}
