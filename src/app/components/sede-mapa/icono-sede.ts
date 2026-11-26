import * as L from 'leaflet';

// Con el bundler de Angular el ícono por defecto de Leaflet no encuentra sus imágenes;
// angular.json copia node_modules/leaflet/dist/images a /leaflet.
export const iconoSede = L.icon({
  iconUrl: 'leaflet/marker-icon.png',
  iconRetinaUrl: 'leaflet/marker-icon-2x.png',
  shadowUrl: 'leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

export const CENTRO_LIMA: L.LatLngTuple = [-12.0464, -77.0428];

export const CAPA_OSM = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const ATRIBUCION_OSM = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export function tieneCoordenadas(latitud: number | null | undefined, longitud: number | null | undefined): boolean {
  return latitud != null && longitud != null
    && !(latitud === 0 && longitud === 0)
    && Number.isFinite(latitud) && Number.isFinite(longitud);
}
