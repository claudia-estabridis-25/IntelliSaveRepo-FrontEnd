import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Prediction, PredictionRequest, PredictionResult } from '../models/prediction';

@Injectable({
  providedIn: 'root'
})
export class PredictionService {
  private url = `${environment.apiUrl}/api/predictions`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Prediction[]> {
    return this.http.get<Prediction[]>(this.url);
  }

  generar(solicitud: PredictionRequest): Observable<PredictionResult> {
    return this.http.post<PredictionResult>(this.url, solicitud);
  }

  evaluar(): Observable<Prediction[]> {
    return this.http.post<Prediction[]>(`${this.url}/evaluate`, {});
  }

  analizar(id: number): Observable<Prediction> {
    return this.http.post<Prediction>(`${this.url}/${id}/analysis`, {});
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
