import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Company } from '../models/company';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private url = `${environment.apiUrl}/api/companies`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Company[]> {
    return this.http.get<Company[]>(this.url);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}