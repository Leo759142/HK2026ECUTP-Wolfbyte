import type { Coordinates, UserLocation } from '../types/poi';

export interface CityPreset {
  name: string;
  country: string;
  coords: Coordinates;
}

export const CITY_PRESETS: CityPreset[] = [
  { name: 'Lima', country: 'Perú', coords: { lat: -12.046374, lng: -77.042793, accuracy: 2500 } },
  { name: 'Madrid', country: 'España', coords: { lat: 40.416775, lng: -3.70379, accuracy: 2500 } },
  { name: 'Ciudad de México', country: 'México', coords: { lat: 19.432608, lng: -99.133209, accuracy: 2500 } },
  { name: 'Buenos Aires', country: 'Argentina', coords: { lat: -34.603722, lng: -58.381592, accuracy: 2500 } },
  { name: 'Bogotá', country: 'Colombia', coords: { lat: 4.710989, lng: -74.072092, accuracy: 2500 } },
  { name: 'Santiago', country: 'Chile', coords: { lat: -33.44889, lng: -70.669265, accuracy: 2500 } },
  { name: 'Barcelona', country: 'España', coords: { lat: 41.3879, lng: 2.16992, accuracy: 2500 } },
  { name: 'Nueva York', country: 'EE.UU.', coords: { lat: 40.712776, lng: -74.005974, accuracy: 2500 } },
];

export class GeoLocationService {
  private static STORAGE_KEY = 'geosocial_user_location';

  /**
   * Guarda la última ubicación aceptada en localStorage para acelerar el arranque offline
   */
  public static getCachedLocation(): UserLocation | null {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignorar errores de acceso a localStorage
    }
    return null;
  }

  public static setCachedLocation(location: UserLocation): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(location));
    } catch {
      // Ignorar errores
    }
  }

  /**
   * 1. Solicita ubicación precisa vía GPS del navegador (móvil o desktop)
   * RF-01 y RNF-02 (Consentimiento explícito)
   */
  public static async getGpsLocation(): Promise<UserLocation> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !('geolocation' in navigator)) {
        return reject(new Error('La API de geolocalización no está soportada en este entorno.'));
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location: UserLocation = {
            coords: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: Math.round(position.coords.accuracy || 25),
            },
            provider: 'gps',
            timestamp: position.timestamp || Date.now(),
          };

          // Intento silencioso de resolver nombre de ciudad vía reverse geocoding
          try {
            const place = await GeoLocationService.reverseGeocode(
              location.coords.lat,
              location.coords.lng
            );
            if (place) {
              location.city = place.city || place.name;
              location.country = place.country;
            }
          } catch {
            // No crítico
          }

          GeoLocationService.setCachedLocation(location);
          resolve(location);
        },
        (error) => {
          let errorMsg = 'Error al obtener GPS';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMsg = 'Permiso denegado por el usuario.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMsg = 'Información de GPS no disponible en este dispositivo.';
              break;
            case error.TIMEOUT:
              errorMsg = 'Tiempo de espera agotado al conectar con el sensor GPS.';
              break;
          }
          reject(new Error(errorMsg));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 15000,
        }
      );
    });
  }

  /**
   * 2. Fallback permisivo: Geolocalización aproximada por IP
   * Consulta proveedores públicos con tolerancia a fallos
   */
  public static async getIpLocation(): Promise<UserLocation> {
    try {
      // Intento 1: ipwho.is (CORS amigable, sin API key)
      const res = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success !== false && data.latitude && data.longitude) {
          const loc: UserLocation = {
            coords: {
              lat: data.latitude,
              lng: data.longitude,
              accuracy: 12000, // exactitud típica a nivel metropolitano (~12km)
            },
            provider: 'ip',
            city: data.city,
            country: data.country,
            ip: data.ip,
            timestamp: Date.now(),
          };
          GeoLocationService.setCachedLocation(loc);
          return loc;
        }
      }
    } catch {
      // Intentar fallback 2
    }

    try {
      // Intento 2: ipapi.co
      const res2 = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(6000) });
      if (res2.ok) {
        const data = await res2.json();
        if (data && data.latitude && data.longitude) {
          const loc: UserLocation = {
            coords: {
              lat: data.latitude,
              lng: data.longitude,
              accuracy: 10000,
            },
            provider: 'ip',
            city: data.city,
            country: data.country_name,
            ip: data.ip,
            timestamp: Date.now(),
          };
          GeoLocationService.setCachedLocation(loc);
          return loc;
        }
      }
    } catch {
      // Fallback
    }

    // Si ambas APIs fallan (ej. sin conexión a internet), usar el preset o última caché
    const cached = GeoLocationService.getCachedLocation();
    if (cached) return cached;

    // Default predeterminado en caso de fallo absoluto offline
    const defaultCity = CITY_PRESETS[0];
    return {
      coords: defaultCity.coords,
      provider: 'manual',
      city: defaultCity.name,
      country: defaultCity.country,
      timestamp: Date.now(),
    };
  }

  /**
   * 3. Geocodificación inversa con OpenStreetMap Nominatim
   */
  public static async reverseGeocode(lat: number, lng: number): Promise<{ name?: string; city?: string; country?: string; fullAddress?: string } | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'es,en' },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const addr = data.address || {};
      const city = addr.city || addr.town || addr.municipality || addr.village || addr.county || '';
      const country = addr.country || '';
      const road = addr.road || addr.pedestrian || addr.suburb || '';
      return {
        name: road || city,
        city,
        country,
        fullAddress: data.display_name || '',
      };
    } catch {
      return null;
    }
  }
}
