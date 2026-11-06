import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Equipment } from '../models/equipment';

@Injectable({
  providedIn: 'root'
})
export class EquipmentService {
  private url = `${environment.apiUrl}/api/equipments`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Equipment[]> {
    return this.http.get<Equipment[]>(this.url);
  }

  darDeBaja(id: number): Observable<Equipment> {
    return this.http.patch<Equipment>(`${this.url}/${id}/deactivate`, {});
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}