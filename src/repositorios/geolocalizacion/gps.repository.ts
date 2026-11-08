/* ==================================================================
 *  AYNI · Repositorio GPS (navegador)
 *  ---------------------------------------------------------------------
 *  Usa navigator.geolocation para obtener coordenadas precises.
 *  Devuelve coordenadas originales (latitude/longitude) sin enmascarar.
 *  ================================================================== */

import type { Coordenadas, DepartamentoPeru, UbicacionResuelta } from '../../dominio/geolocalizacion/tipos';

const TIMEOUT_MS = 15000;

export class GPSRepository {
  async detectarUbicacion(): Promise<Coordenadas> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalización no soportada'));
        return;
      }

      const onSuccess = (position: GeolocationPosition) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          fuente: 'gps',
        });
      };

      const onError = (error: GeolocationPositionError) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new GeolocalizacionError('Permiso de ubicación denegado', 'PERMISSION_DENIED', 'gps'));
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          reject(new GeolocalizacionError('Coordenadas no disponibles', 'POSITION_UNAVAILABLE', 'gps'));
        } else if (error.code === error.TIMEOUT) {
          reject(new GeolocalizacionError('Timeout en GPS', 'TIMEOUT', 'gps'));
        } else {
          reject(new GeolocalizacionError('Error GPS desconocido', 'POSITION_UNAVAILABLE', 'gps'));
        }
      };

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: TIMEOUT_MS,
        maximumAge: 30000,
      };

      navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
    });
  }
}