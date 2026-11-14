/**
 * Borde HTTP de la API AYNI:
 * - Sesión: token de la cookie httpOnly `ayni_sesion` o de `Authorization: Bearer` → locals.sesion (rol calculado en la base).
 * - CORS solo para los orígenes de CORS_ORIGINS (en desarrollo el frontend usa el proxy de Vite: mismo origen).
 * - Protección CSRF en producción: las escrituras con origen ajeno se rechazan.
 * - Límite de peticiones por IP (más estricto en /auth).
 */
import type { Handle, HandleServerError } from '@sveltejs/kit/hooks';
import { config } from '#server/config.ts';
import { obtenerDb } from '#server/db/index.ts';
import { leerSesion, tokenDeRequest } from '#server/auth/sesion.ts';
import { json } from '#server/http.ts';

const VENTANA_MS = 60_000;
const LIMITE_GENERAL = 600;
const LIMITE_AUTH = 30;
const contador = new Map<string, { inicio: number; n: number }>();

function permitido(clave: string, limite: number): boolean {
	const ahora = Date.now();
	const r = contador.get(clave);
	if (!r || ahora - r.inicio > VENTANA_MS) {
		contador.set(clave, { inicio: ahora, n: 1 });
		if (contador.size > 10_000) for (const [k, x] of contador) if (ahora - x.inicio > VENTANA_MS) contador.delete(k);
		return true;
	}
	r.n += 1;
	return r.n <= limite;
}

function cabecerasCors(origen: string | null): Record<string, string> {
	if (!origen || !config().corsOrigins.includes(origen)) return {};
	return {
		'access-control-allow-origin': origen,
		'access-control-allow-credentials': 'true',
		'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
		'access-control-allow-headers': 'content-type, authorization',
		'access-control-max-age': '600',
		vary: 'Origin'
	};
}

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.sesion = null;
	event.locals.registro = null;
	const { url, request } = event;
	if (!url.pathname.startsWith('/api/')) return resolve(event);

	const origen = request.headers.get('origin');
	const cors = cabecerasCors(origen);
	if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

	const cfg = config();
	const escritura = !['GET', 'HEAD'].includes(request.method);
	if (cfg.produccion && escritura && origen && origen !== url.origin && !cfg.corsOrigins.includes(origen)) {
		return json({ codigo: 'ORIGEN_NO_PERMITIDO', mensaje: 'Origen no permitido.' }, 403);
	}

	let ip = 'desconocida';
	try {
		ip = event.getClientAddress();
	} catch {
		/* sin IP (tests) */
	}
	const esAuth = url.pathname.startsWith('/api/v1/auth/');
	if (!permitido(`${ip}:${esAuth ? 'auth' : 'api'}`, esAuth ? LIMITE_AUTH : LIMITE_GENERAL)) {
		return json({ codigo: 'LIMITE_EXCEDIDO', mensaje: 'Demasiadas peticiones. Espera un momento e inténtalo otra vez.' }, 429, cors);
	}

	const token = tokenDeRequest(request, event.cookies);
	if (token) {
		try {
			const { sesion, registro } = await leerSesion(await obtenerDb(), token);
			event.locals.sesion = sesion;
			event.locals.registro = registro;
		} catch (e) {
			console.error('[AYNI] No se pudo leer la sesión:', e);
			return json({ codigo: 'BASE_NO_DISPONIBLE', mensaje: 'El servidor no puede conectarse a la base de datos.' }, 503, cors);
		}
	}

	const res = await resolve(event);
	const h = new Headers(res.headers);
	for (const [k, v] of Object.entries(cors)) h.set(k, v);
	h.set('x-content-type-options', 'nosniff');
	h.set('referrer-policy', 'no-referrer');
	if (!h.has('cache-control')) h.set('cache-control', 'no-store');
	return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
};

export const handleError: HandleServerError = ({ kind, error }) => {
	if (kind === 'unknown') console.error('[AYNI] Error no controlado:', error);
	return { codigo: 'ERROR_INTERNO', mensaje: 'Algo salió mal en el servidor. Inténtalo otra vez en un momento.' };
};
