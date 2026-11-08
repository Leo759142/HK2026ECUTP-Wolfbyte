/* ==================================================================
 *  AYNI · Repositorio Offline (bounding boxes de regiones)
 *  ---------------------------------------------------------------------
 *  Uso de cajas del territorio para determinar la region donde
 *  se encuentra el usuario cuando no hay red (fallback).
 *  ================================================================== */
import type { Coordenadas, DepartamentoPeru } from '../../dominio/geolocalizacion/tipos';
// Bounding boxes de departamentos (centro + rango aprox)
export const DEPARTAMENTOS_PERU = {
  amazonas: { latMin: -6.8, latMax: -4.9, lngMin: -78.3, lngMax: -72.4, centro: { lat: -5.90, lng: -75.20 }, nombre: 'Amazonas' },
  ancash: { latMin: -10.0, latMax: -9.0, lngMin: -79.0, lngMax: -77.0, centro: { lat: -9.5, lng: -77.8 }, nombre: 'Áncash' },
  apurimac: { latMin: -13.2, latMax: -12.3, lngMin: -75.0, lngMax: -73.6, centro: { lat: -12.7, lng: -74.3 }, nombre: 'Apurímac' },
  arequipa: { latMin: -18.0, latMax: -16.3, lngMin: -73.5, lngMax: -71.4, centro: { lat: -17.18, lng: -72.56 }, nombre: 'Arequipa' },
  ayacucho: { latMin: -14.5, latMax: -13.0, lngMin: -76.5, lngMax: -74.5, centro: { lat: -13.7, lng: -75.5 }, nombre: 'Ayacucho' },
  cajamarca: { latMin: -9.4, latMax: -6.8, lngMin: -80.7, lngMax: -76.2, centro: { lat: -8.1, lng: -78.3 }, nombre: 'Cajamarca' },
  callao: { latMin: -12.3, latMax: -11.7, lngMin: -77.7, lngMax: -77.2, centro: { lat: -12.0, lng: -77.45 }, nombre: 'Callao' },
  cusco: { latMin: -14.3, latMax: -13.1, lngMin: -73.5, lngMax: -70.8, centro: { lat: -13.51, lng: -71.99 }, nombre: 'Cusco' },
  huancavelica: { latMin: -14.8, latMax: -13.4, lngMin: -76.5, lngMax: -74.5, centro: { lat: -14.1, lng: -75.4 }, nombre: 'Huancavelica' },
  huanuco: { latMin: -11.6, latMax: -9.0, lngMin: -77.2, lngMax: -74.8, centro: { lat: -10.3, lng: -75.8 }, nombre: 'Huánuco' },
  ica: { latMin: -15.3, latMax: -14.0, lngMin: -79.0, lngMax: -76.5, centro: { lat: -14.5, lng: -77.9 }, nombre: 'Ica' },
  junin: { latMin: -12.5, latMax: -10.5, lngMin: -76.5, lngMax: -73.0, centro: { lat: -11.5, lng: -74.8 }, nombre: 'Junín' },
  'la libertad': { latMin: -9.7, latMax: -7.9, lngMin: -82.0, lngMax: -77.8, centro: { lat: -8.8, lng: -79.9 }, nombre: 'La Libertad' },
  lambayeque: { latMin: -9.4, latMax: -7.5, lngMin: -82.2, lngMax: -78.2, centro: { lat: -8.4, lng: -80.1 }, nombre: 'Lambayeque' },
  'lima ciudad': { latMin: -13.0, latMax: -11.9, lngMin: -78.0, lngMax: -76.0, centro: { lat: -12.5, lng: -77.0 }, nombre: 'Lima Ciudad' },
  'lima provincias': { latMin: -13.0, latMax: -11.5, lngMin: -80.0, lngMax: -76.0, centro: { lat: -12.5, lng: -78.2 }, nombre: 'Lima Provincias' },
  loreto: { latMin: -7.5, latMax: -3.0, lngMin: -82.0, lngMax: -70.5, centro: { lat: -5.2, lng: -76.5 }, nombre: 'Loreto' },
  'madre de dios': { latMin: -14.5, latMax: -11.5, lngMin: -72.5, lngMax: -68.0, centro: { lat: -13.2, lng: -70.2 }, nombre: 'Madre de Dios' },
  moquegua: { latMin: -18.0, latMax: -17.0, lngMin: -71.5, lngMax: -70.5, centro: { lat: -17.5, lng: -71.0 }, nombre: 'Moquegua' },
  pasco: { latMin: -10.9, latMax: -9.9, lngMin: -76.5, lngMax: -75.0, centro: { lat: -10.4, lng: -76.0 }, nombre: 'Pasco' },
  piura: { latMin: -9.0, latMax: -5.0, lngMin: -85.0, lngMax: -78.0, centro: { lat: -7.0, lng: -81.4 }, nombre: 'Piura' },
  puno: { latMin: -17.5, latMax: -14.5, lngMin: -71.5, lngMax: -68.5, centro: { lat: -16.0, lng: -70.0 }, nombre: 'Puno' },
  'san martin': { latMin: -9.0, latMax: -5.0, lngMin: -83.0, lngMax: -73.5, centro: { lat: -7.0, lng: -78.2 }, nombre: 'San Martín' },
  tacna: { latMin: -20.7, latMax: -17.7, lngMin: -73.2, lngMax: -70.8, centro: { lat: -19.2, lng: -72.0 }, nombre: 'Tacna' },
  tumbes: { latMin: -10.4, latMax: -6.5, lngMin: -82.0, lngMax: -77.8, centro: { lat: -8.5, lng: -79.8 }, nombre: 'Tumbes' },
  ucayali: { latMin: -10.0, latMax: -5.5, lngMin: -76.0, lngMax: -68.0, centro: { lat: -8.0, lng: -72.5 }, nombre: 'Ucayali' },
};

export class OfflineRepository {
  /** Determinar departamento por coordenadas usando bounding boxes offline */
  detectarDepartamento(lat: number, lng: number): DepartamentoPeru | null {
    for (const [key, data] of Object.entries(DEPARTAMENTOS_PERU)) {
      const dep = data as { nombre: string; latMin: number; latMax: number; lngMin: number; lngMax: number };
      if (lat >= dep.latMin && lat <= dep.latMax && lng >= dep.lngMin && lng <= dep.lngMax) {
        return dep.nombre as DepartamentoPeru;
      }
    }
    return null;
  }

  /** Obtener coordenadas del centro del departamento */
  obtenerCentro(departamento: DepartamentoPeru): { lat: number; lng: number; nombre: string } | null {
    for (const [key, data] of Object.entries(DEPARTAMENTOS_PERU)) {
      if (key === departamento) {
        const d = data as { centro: { lat: number; lng: number }; nombre: string };
        return { lat: d.centro.lat, lng: d.centro.lng, nombre: d.nombre };
      }
    }
    return null;
  }
}

