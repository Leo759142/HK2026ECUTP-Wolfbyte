import type { RequestHandler } from './$types';

const CACHE = new Map<string, { data: any; ts: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora

export const GET: RequestHandler = async ({ url }) => {
	const q = url.searchParams.get('q');

	if (!q) {
		return new Response(JSON.stringify({ error: 'q es requerido' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const key = `search:${q.toLowerCase()}`;
	const ahora = Date.now();
	const cached = CACHE.get(key);
	if (cached && ahora - cached.ts < CACHE_TTL_MS) {
		return new Response(JSON.stringify(cached.data), {
			headers: { 'Content-Type': 'application/json' }
		});
	}

	try {
		const res = await fetch(
			`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&accept-language=es,en&limit=5`,
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

		// Solo devolver lo necesario, sin direcciones exactas
		const resultados = data.map((item: any) => ({
			lat: Number(item.lat),
			lng: Number(item.lon),
			display_name: item.display_name ?? '',
			tipo: item.type ?? '',
			clase: item.class ?? ''
		}));

		CACHE.set(key, { data: resultados, ts: ahora });

		return new Response(JSON.stringify(resultados), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch {
		return new Response(JSON.stringify({ error: 'No se pudo buscar la ubicación' }), {
			status: 502,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};