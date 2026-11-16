import type { Coordinates } from '../types/poi';

/**
 * Fórmula de Haversine para calcular distancia esférica en km
 * Cumple con RNF-01 (eficiencia algorítmica O(1)) y RF-05.
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  if (
    typeof coord1.lat !== 'number' ||
    typeof coord1.lng !== 'number' ||
    typeof coord2.lat !== 'number' ||
    typeof coord2.lng !== 'number'
  ) {
    return 0;
  }

  const R = 6371; // Radio de la Tierra en kilómetros
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLon = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Redondear a 2 decimales
  return Math.round(distance * 100) / 100;
}

/**
 * Formatea la distancia de manera intuitiva para la UX móvil (metros si es < 1km, km en caso contrario)
 */
export function formatDistance(km: number | undefined | null): string {
  if (km === undefined || km === null || isNaN(km)) return 'Distancia desc.';
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return `${meters} m`;
  }
  return `${km.toFixed(2)} km`;
}

/**
 * Calcula la orientación cardinal (N, NE, E, SE, S, SW, W, NW)
 */
export function getCardinalBearing(start: Coordinates, end: Coordinates): string {
  const startLat = (start.lat * Math.PI) / 180;
  const startLng = (start.lng * Math.PI) / 180;
  const endLat = (end.lat * Math.PI) / 180;
  const endLng = (end.lng * Math.PI) / 180;

  const dLng = endLng - startLng;
  const y = Math.sin(dLng) * Math.cos(endLat);
  const x =
    Math.cos(startLat) * Math.sin(endLat) -
    Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);

  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  brng = (brng + 360) % 360;

  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(brng / 45) % 8;
  return directions[index];
}

/**
 * Genera enlaces universales para navegación externa
 */
export function getDirectionsUrl(coords: Coordinates, destName?: string): { osm: string; gmaps: string } {
  const osm = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=%3B${coords.lat}%2C${coords.lng}`;
  const gmaps = `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}${destName ? `&destination_place_id=${encodeURIComponent(destName)}` : ''}`;
  return { osm, gmaps };
}
