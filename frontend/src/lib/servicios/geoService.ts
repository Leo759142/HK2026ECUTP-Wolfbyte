import type { Coordinates, UserLocation } from '../types/poi';

export interface CityPreset {
  id?: string;
  name: string;
  country: string;
  coords: Coordinates;
  provinciaId?: string;
  distritoId?: string;
}

export const CITY_PRESETS: CityPreset[] = [
  { id: '1501', name: 'Lima', country: 'Perú', coords: { lat: -12.046374, lng: -77.042793, accuracy: 25000 }, provinciaId: '1501', distritoId: '150101' },
  { id: '0401', name: 'Arequipa', country: 'Perú', coords: { lat: -16.409047, lng: -71.537451, accuracy: 25000 }, provinciaId: '0401', distritoId: '040101' },
  { id: '1301', name: 'Trujillo', country: 'Perú', coords: { lat: -8.109052, lng: -79.021534, accuracy: 25000 }, provinciaId: '1301', distritoId: '130101' },
  { id: '1401', name: 'Chiclayo', country: 'Perú', coords: { lat: -6.77137, lng: -79.84088, accuracy: 25000 }, provinciaId: '1401', distritoId: '140101' },
  { id: '2001', name: 'Piura', country: 'Perú', coords: { lat: -5.19449, lng: -80.63282, accuracy: 25000 }, provinciaId: '2001', distritoId: '200101' },
  { id: '0801', name: 'Cusco', country: 'Perú', coords: { lat: -13.53195, lng: -71.967463, accuracy: 25000 }, provinciaId: '0801', distritoId: '080101' },
  { id: '1201', name: 'Huancayo', country: 'Perú', coords: { lat: -12.06513, lng: -75.20486, accuracy: 25000 }, provinciaId: '1201', distritoId: '120101' },
  { id: '1601', name: 'Iquitos', country: 'Perú', coords: { lat: -3.743673, lng: -73.251632, accuracy: 25000 }, provinciaId: '1601', distritoId: '160101' },
  { id: '2101', name: 'Juliaca', country: 'Perú', coords: { lat: -15.5, lng: -70.133333, accuracy: 25000 }, provinciaId: '2101', distritoId: '210101' },
  { id: '2301', name: 'Tacna', country: 'Perú', coords: { lat: -18.01465, lng: -70.25362, accuracy: 25000 }, provinciaId: '2301', distritoId: '230101' },
  { id: '0701', name: 'Callao', country: 'Perú', coords: { lat: -12.05659, lng: -77.11814, accuracy: 25000 }, provinciaId: '0701', distritoId: '070101' },
];

const STORAGE_KEY = 'ayni_user_location';
const REVERSE_CACHE_KEY = 'ayni_reverse_geocode_cache';
const REVERSE_TTL_MS = 24 * 60 * 60 * 1000;

function roundCoord(n: number) {
  return Math.round(n * 1000) / 1000;
}

export class GeoLocationService {
  public static getCachedLocation(): UserLocation | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as UserLocation) : null;
    } catch {
      return null;
    }
  }

  public static setCachedLocation(location: UserLocation): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
    } catch {
      // ignore quota/security errors
    }
  }

  private static getReverseCache(key: string) {
    try {
      const raw = localStorage.getItem(REVERSE_CACHE_KEY);
      if (!raw) return null;
      const all = JSON.parse(raw) as Record<string, { ts: number; value: any }>;
      const hit = all[key];
      if (!hit || Date.now() - hit.ts > REVERSE_TTL_MS) return null;
      return hit.value;
    } catch {
      return null;
    }
  }

  private static setReverseCache(key: string, value: any) {
    try {
      const raw = localStorage.getItem(REVERSE_CACHE_KEY);
      const all = raw ? (JSON.parse(raw) as Record<string, { ts: number; value: any }>) : {};
      all[key] = { ts: Date.now(), value };
      localStorage.setItem(REVERSE_CACHE_KEY, JSON.stringify(all));
    } catch {
      // ignore
    }
  }

  public static approxLocation(loc: UserLocation): { lat_aprox: number; lng_aprox: number } {
    return { lat_aprox: roundCoord(loc.coords.lat), lng_aprox: roundCoord(loc.coords.lng) };
  }

  public static async getGpsLocation(): Promise<UserLocation> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !('geolocation' in navigator)) {
        return reject(new Error('La API de geolocalización no está disponible en este dispositivo.'));
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
          try {
            const place = await GeoLocationService.reverseGeocode(location.coords.lat, location.coords.lng);
            if (place) {
              location.city = place.city || place.name;
              location.country = place.country;
              location.fullAddress = place.fullAddress;
            }
          } catch {
            // non-critical
          }
          GeoLocationService.setCachedLocation(location);
          resolve(location);
        },
        (error) => {
          let errorMsg = 'No se pudo obtener tu ubicación por GPS.';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMsg = 'Permiso de ubicación denegado.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMsg = 'El GPS no está disponible en este momento.';
              break;
            case error.TIMEOUT:
              errorMsg = 'Se agotó el tiempo para obtener el GPS.';
              break;
          }
          reject(new Error(errorMsg));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 }
      );
    });
  }

  public static async getIpLocation(): Promise<UserLocation> {
    const tryIpWho = async (): Promise<UserLocation | null> => {
      const res = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(6000) });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || data.success === false || data.latitude == null || data.longitude == null) return null;
      return {
        coords: { lat: data.latitude, lng: data.longitude, accuracy: 12000 },
        provider: 'ip',
        city: data.city,
        country: data.country,
        ip: data.ip,
        timestamp: Date.now(),
      };
    };
    const tryIpApi = async (): Promise<UserLocation | null> => {
      const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(6000) });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || data.latitude == null || data.longitude == null) return null;
      return {
        coords: { lat: data.latitude, lng: data.longitude, accuracy: 10000 },
        provider: 'ip',
        city: data.city,
        country: data.country_name,
        ip: data.ip,
        timestamp: Date.now(),
      };
    };

    for (const fn of [tryIpWho, tryIpApi]) {
      try {
        const loc = await fn();
        if (loc) {
          GeoLocationService.setCachedLocation(loc);
          return loc;
        }
      } catch {
        // try next
      }
    }

    const cached = GeoLocationService.getCachedLocation();
    if (cached) return cached;

    const def = CITY_PRESETS[0];
    const fallback: UserLocation = {
      coords: def.coords,
      provider: 'manual',
      city: def.name,
      country: def.country,
      provinciaId: def.provinciaId,
      distritoId: def.distritoId,
      timestamp: Date.now(),
    };
    GeoLocationService.setCachedLocation(fallback);
    return fallback;
  }

  
  /* ================================================================
   *  watchPosition / stopWatch — seguimiento continuo GPS (móvil)
   * ================================================================ */
  public static watchPosition(
    onSuccess: (loc: UserLocation) => void,
    onError?: (err: GeolocationPositionError) => void
  ): number {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      throw new Error('La API de geolocalización no está soportada en este entorno.');
    }
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const loc: UserLocation = {
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: Math.round(position.coords.accuracy || 25),
          },
          provider: 'gps',
          timestamp: position.timestamp || Date.now(),
        };
        GeoLocationService.setCachedLocation(loc);
        onSuccess(loc);
      },
      onError,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 }
    );
    return watchId;
  }

  public static stopWatch(watchId: number): void {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchId);
    }
  }

  /* ================================================================
   *  geocode — geocodificación directa (nombre/dirección → coords)
   * ================================================================ */
  public static async geocode(
    query: string
  ): Promise<Array<{ lat: number; lng: number; name: string; address?: string; city?: string; country?: string }>> {
    const cacheKey = 'geocode:' + query.toLowerCase().trim();
    try {
      const cached = localStorage.getItem('ayni_geocode_cache');
      const all = cached ? (JSON.parse(cached) as Record<string, any[]>) : {};
      if (all[cacheKey]) return all[cacheKey];
    } catch { /* ignore */ }

    const results = [];
    try {
      const url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&q=' + encodeURIComponent(query) + '&accept-language=es,en&limit=5';
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'es,en' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return results;
      const data = await res.json();
      for (const item of data) {
        results.push({
          lat: Number(item.lat),
          lng: Number(item.lon),
          name: item.display_name || query,
          address: item.address?.road || item.address?.pedestrian || '',
          city: item.address?.city || item.address?.town || item.address?.village || item.address?.municipality || '',
          country: item.address?.country || '',
        });
      }
      try {
        const cached = localStorage.getItem('ayni_geocode_cache');
        const all = cached ? (JSON.parse(cached) as Record<string, any[]>) : {};
        all[cacheKey] = results;
        localStorage.setItem('ayni_geocode_cache', JSON.stringify(all));
      } catch { /* ignore */ }
    } catch { /* fallthrough: devolver [] */ }
    return results;
  }

public static async reverseGeocode(
    lat: number,
    lng: number
  ): Promise<{ name?: string; city?: string; country?: string; fullAddress?: string } | null> {
    const cacheKey = `${roundCoord(lat)},${roundCoord(lng)}`;
    const cached = this.getReverseCache(cacheKey);
    if (cached) return cached;
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
      const road = addr.road || addr.pedestrian || addr.suburb || addr.neighbourhood || '';
      const value = {
        name: road || city,
        city,
        country,
        fullAddress: data.display_name || '',
      };
      this.setReverseCache(cacheKey, value);
      return value;
    } catch {
      return null;
    }
  }
}

export function approxFromLocation(loc: UserLocation | null | undefined) {
  if (!loc?.coords) return null;
  return { lat_aprox: roundCoord(loc.coords.lat), lng_aprox: roundCoord(loc.coords.lng) };
}
