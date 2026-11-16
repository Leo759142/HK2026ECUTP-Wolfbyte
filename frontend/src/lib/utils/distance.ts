import type { Coordinates } from '../types/poi';

/** Haversine distance in km */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  if (
    typeof coord1?.lat !== 'number' ||
    typeof coord1?.lng !== 'number' ||
    typeof coord2?.lat !== 'number' ||
    typeof coord2?.lng !== 'number'
  ) {
    return 0;
  }

  const R = 6371;
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLon = ((coord2.lng - coord1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

export function formatDistance(km: number | undefined | null): string {
  if (km === undefined || km === null || Number.isNaN(km)) return 'Distancia desc.';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(2)} km`;
}

export function getDirectionsUrl(
  coords: Coordinates,
  destName?: string
): { osm: string; gmaps: string } {
  const osm = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=%3B${coords.lat}%2C${coords.lng}`;
  const gmaps = `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}${destName ? `&destination_place_id=${encodeURIComponent(destName)}` : ''}`;
  return { osm, gmaps };
}
