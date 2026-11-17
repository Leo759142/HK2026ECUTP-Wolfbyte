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
			`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`,
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

		// Dirección legible a partir de la respuesta de Nominatim (calle, número, barrio, ciudad).
		const a = data.address ?? {};
		const calle = [a.road, a.house_number].filter(Boolean).join(' ');
		const direccionTexto =
			[calle, a.neighbourhood ?? a.suburb, a.city ?? a.town ?? a.village ?? a.municipality]
				.filter(Boolean)
				.join(', ') ||
			data.display_name ||
			'Ubicación aproximada';
		const resultado = {
			lat: Number(lat),
			lng: Number(lng),
			direccion: direccionTexto,
			distrito: a.suburb ?? a.city_district ?? a.city ?? '',
			barrio: a.neighbourhood ?? a.quarter ?? '',
			departamento: a.state ?? '',
			pais: a.country ?? '',
			display_name: direccionTexto
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