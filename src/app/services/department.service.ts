import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Department } from '../models/department';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private url = `${environment.apiUrl}/api/departments`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Department[]> {
    return this.http.get<Department[]>(this.url);
  }
}