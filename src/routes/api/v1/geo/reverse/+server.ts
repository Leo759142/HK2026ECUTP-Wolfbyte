import type { RequestHandler } from './$types';

const CACHE = new Map<string, { data: any; ts: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora

function cacheKey(lat: string, lng: string): string {
	return `reverse:${lat}:${lng}`;
}

export const GET: RequestHandler = async ({ url }) => {
	const lat = url.searchParams.get('lat');
	const lng = url.searchParams.get('lng');

	if (!lat || !lng) {
		return new Response(JSON.stringify({ error: 'lat y lng son requeridos' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const key = cacheKey(lat, lng);
	const ahora = Date.now();
	const cached = CACHE.get(key);
	if (cached && ahora - cached.ts < CACHE_TTL_MS) {
		return new Response(JSON.stringify(cached.data), {
			headers: { 'Content-Type': 'application/json' }
		});
	}

	try {
		const res = await fetch(
			`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=16&addressdetails=1`,
			{
				headers: {
					'User-Agent': 'AYNI/1.0 (contacto@ayni.pe)',
					'Accept-Language': 'es,en'
				}
			}
		);

		if (!res.ok) {
			return new Response(JSON.stringify({ error: 'Error del servicio de geocodificación' }), {
				status: 502,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const data = await res.json();

		// Privacidad: solo devolver distrito y barrio, descartar dirección exacta
		const direccion = data.address ?? {};
		const resultado = {
			lat: Number(lat),
			lng: Number(lng),
			distrito: direccion.suburb ?? direccion.city_district ?? direccion.city ?? '',
			barrio: direccion.neighbourhood ?? direccion.quarter ?? '',
			departamento: direccion.state ?? '',
			pais: direccion.country ?? '',
			display_name: direccion.suburb || direccion.city || 'Ubicación aproximada'
		};

		CACHE.set(key, { data: resultado, ts: ahora });

		return new Response(JSON.stringify(resultado), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch {
		return new Response(JSON.stringify({ error: 'No se pudo resolver la ubicación' }), {
			status: 502,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};