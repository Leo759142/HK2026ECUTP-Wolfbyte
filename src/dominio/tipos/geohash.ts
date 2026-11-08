import type { CoordenadaAprox } from './tipos';

export interface UbicacionAproximada extends CoordenadaAprox {
	geohash_muro: string;
}

export function validarCoordenadas(lat: number, lng: number): void {
	if (
		!Number.isFinite(lat) ||
		!Number.isFinite(lng) ||
		lat < -90 ||
		lat > 90 ||
		lng < -180 ||
		lng > 180
	) {
		throw new RangeError('Coordenadas fuera de rango');
	}
}

/** Trunca coordenadas a ~100-150m para proteger la ubicación exacta del hogar. */
export function enmascararCoordenadas(lat: number, lng: number): UbicacionAproximada {
	validarCoordenadas(lat, lng);
	const lat_aprox = Math.round(lat * 1000) / 1000;
	const lng_aprox = Math.round(lng * 1000) / 1000;
	const token = `${lat_aprox.toFixed(3)},${lng_aprox.toFixed(3)}`;
	const geohash_muro =
		typeof btoa !== 'undefined' ? btoa(token).replace(/=+$/, '').slice(0, 8) : token;
	return { lat_aprox, lng_aprox, geohash_muro };
}

export class GeohashAnonimizador {
	static anonimizarCoordenadas(latitud: number, longitud: number): string {
		return enmascararCoordenadas(latitud, longitud).geohash_muro;
	}
}
