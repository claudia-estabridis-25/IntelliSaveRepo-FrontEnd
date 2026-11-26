import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface UbicacionEncontrada {
  latitud: number;
  longitud: number;
  nombre: string;
}

interface ResultadoNominatim {
  lat: string;
  lon: string;
  display_name: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeocodificacionService {
  // Nominatim (OpenStreetMap) permite como máximo 1 consulta por segundo.
  private url = 'https://nominatim.openstreetmap.org/search';

  constructor(private http: HttpClient) {}

  /** Devuelve la primera coincidencia de la dirección en Perú, o null si no se encontró. */
  buscar(direccion: string): Observable<UbicacionEncontrada | null> {
    const params = new HttpParams()
      .set('format', 'json')
      .set('limit', 1)
      .set('countrycodes', 'pe')
      .set('accept-language', 'es')
      .set('q', direccion);

    return this.http.get<ResultadoNominatim[]>(this.url, { params }).pipe(
      map(resultados => {
        const primero = resultados[0];
        if (!primero) {
          return null;
        }
        return {
          latitud: Number(Number(primero.lat).toFixed(6)),
          longitud: Number(Number(primero.lon).toFixed(6)),
          nombre: primero.display_name
        };
      })
    );
  }
}
