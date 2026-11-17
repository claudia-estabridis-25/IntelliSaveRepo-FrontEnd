import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Branch } from '../models/branch';

@Injectable({
  providedIn: 'root'
})
export class BranchService {
  private url = `${environment.apiUrl}/api/branches`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Branch[]> {
    return this.http.get<Branch[]>(this.url);
  }
}
