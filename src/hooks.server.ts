import type { Handle } from '@sveltejs/kit';
import type { Rol, AccionRbac } from './dominio/roles/rbac';
import { puedeRol } from './dominio/roles/rbac';
import { verificarPin } from './seguridad/pin';

const COOKIE_SESION = 'pod_sesion';
const COOKIE_ROL = 'pod_rol';

// Rutas públicas de lectura (no requieren rol)
const RUTAS_LECTURA_PUBLICA = ['/api/docs', '/api/v1/sync'];

// Rate limit en memoria: clave = ip + ruta, ventana deslizante simple
type RegistroRateLimit = { timestamps: number[] };
const rateLimitStore = new Map<string, RegistroRateLimit>();
const LIMITE_PETICIONES = 30; // peticiones por ventana
const VENTANA_MS = 60_000; // 1 minuto

function obtenerIp(event: App.LoadEvent): string {
	return event.request.headers.get('x-forwarded-for') ?? event.request.headers.get('x-real-ip') ?? 'desconocido';
}

function rateLimitOk(ip: string, ruta: string): boolean {
	const clave = `${ip}:${ruta}`;
	const ahora = Date.now();
	let reg = rateLimitStore.get(clave);
	if (!reg) {
		reg = { timestamps: [] };
		rateLimitStore.set(clave, reg);
	}
	reg.timestamps = reg.timestamps.filter((t) => ahora - t < VENTANA_MS);
	if (reg.timestamps.length >= LIMITE_PETICIONES) return false;
	reg.timestamps.push(ahora);
	return true;
}

function leerSesionCookie(cookies: App.Cookies): { usuarioId?: string; rol?: string } | null {
	const sesion = cookies.get(COOKIE_SESION);
	if (!sesion) return null;
	try {
		const payload = JSON.parse(sesion) as { usuarioId?: string; rol?: string; exp?: number };
		if (!payload.usuarioId || !payload.rol) return null;
		if (payload.exp && Date.now() > payload.exp) return null;
		return payload;
	} catch {
		return null;
	}
}

function escribirSesionCookie(cookies: App.Cookies, sesion: { usuarioId: string; rol: string }): void {
	const exp = Date.now() + 24 * 60 * 60 * 1000; // 24h
	cookies.set(COOKIE_SESION, JSON.stringify({ ...sesion, exp }), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: import.meta.env.PROD,
		maxAge: 60 * 60 * 24
	});
	cookies.set(COOKIE_ROL, sesion.rol, {
		path: '/',
		httpOnly: false,
		sameSite: 'lax',
		secure: import.meta.env.PROD,
		maxAge: 60 * 60 * 24
	});
}

function borrarSesionCookie(cookies: App.Cookies): void {
	cookies.delete(COOKIE_SESION, { path: '/' });
	cookies.delete(COOKIE_ROL, { path: '/' });
}

export const handle: Handle = async ({ event, resolve }) => {
	const { url, request, cookies } = event;
	const ruta = url.pathname;

	if (!ruta.startsWith('/api/')) {
		return resolve(event);
	}

	const metodo = request.method as string;

	// Rate limit para todas las peticiones API
	const ip = obtenerIp(event as App.LoadEvent);
	if (!rateLimitOk(ip, ruta)) {
		return new Response(
			JSON.stringify({
				type: 'about:blank',
				title: 'Demasiadas peticiones',
				status: 429,
				detail: 'Límite de peticiones excedido. Inténtelo de nuevo más tarde.'
			}),
			{ status: 429, headers: { 'content-type': 'application/problem+json' } }
		);
	}

	// Sesión: intentar recuperar de cookie
	const sesion = leerSesionCookie(cookies);
	if (sesion) {
		event.locals.usuarioId = sesion.usuarioId;
		event.locals.rol = sesion.rol as Rol;
	}

	// Rutas públicas de lectura GET: sin rol requerido
	const esLecturaPublica =
		metodo === 'GET' && RUTAS_LECTURA_PUBLICA.some((p) => ruta.startsWith(p));

	if (!esLecturaPublica) {
		if (!sesion) {
			return new Response(
				JSON.stringify({
					type: 'about:blank',
					title: 'Autenticación requerida',
					status: 401,
					detail: 'Inicie sesión para realizar esta acción.'
				}),
				{ status: 401, headers: { 'content-type': 'application/problem+json' } }
			);
		}

		const accion = accionDesdeRuta(ruta, metodo);
		if (accion && !puedeRol(sesion.rol as Rol, accion)) {
			return new Response(
				JSON.stringify({
					type: 'about:blank',
					title: 'Permiso denegado',
					status: 403,
					detail: `El rol ${sesion.rol} no puede ejecutar ${accion}.`
				}),
				{ status: 403, headers: { 'content-type': 'application/problem+json' } }
			);
		}
	}

	const response = await resolve(event);

	// Login legacy vía API directa: establece cookie de sesión si el PIN es válido
	if (!sesion && metodo === 'POST' && ruta === '/api/auth/login') {
		const body = (await request.json().catch(() => null)) as {
			usuarioId?: string;
			pin?: string;
			rol?: Rol;
			hashAlmacenado?: string;
		} | null;
		if (body?.usuarioId && body?.pin && body?.hashAlmacenado) {
			const valido = await verificarPin(body.pin, body.hashAlmacenado);
			if (valido) {
				const exp = Date.now() + 24 * 60 * 60 * 1000;
				cookies.set(COOKIE_SESION, JSON.stringify({ usuarioId: body.usuarioId, rol: body.rol ?? 'Vecino', exp }), {
					path: '/',
					httpOnly: true,
					sameSite: 'lax',
					secure: import.meta.env.PROD,
					maxAge: 60 * 60 * 24
				});
				cookies.set(COOKIE_ROL, body.rol ?? 'Vecino', {
					path: '/',
					httpOnly: false,
					sameSite: 'lax',
					secure: import.meta.env.PROD,
					maxAge: 60 * 60 * 24
				});
			}
		}
	}

	return response;
};

function accionDesdeRuta(ruta: string, metodo: string): AccionRbac | null {
	if (metodo !== 'POST' && metodo !== 'PUT' && metodo !== 'DELETE') return null;
	const segs = ruta.split('/').filter(Boolean);
	if (segs.includes('servicios')) return 'publicar_servicio';
	if (segs.includes('favores')) return 'ofrecer_favor';
	if (segs.includes('emergencias')) return 'activar_emergencia';
	if (segs.includes('alertas')) return 'reportar_emergencia';
	if (segs.includes('sync')) return 'publicar_offline';
	return null;
}