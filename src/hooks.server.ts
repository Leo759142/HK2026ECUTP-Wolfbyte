import type { RequestEvent } from '@sveltejs/kit';

/**
 * Middleware global de SvelteKit.
 * - Valida la cookie de sesión `pod_sesion` en cada request.
 * - Inyecta `event.locals.usuarioId`, `event.locals.rol`, `event.locals.loggedIn`.
 * - Protege rutas de escritura bajo `/api/v1/*` exigiendo sesión activa.
 */
export const handle = async ({ event, resolve }: { event: RequestEvent; resolve: (e: RequestEvent) => Promise<Response> }) => {
	const cookies = event.cookies;
	const sesionRaw = cookies.get('pod_sesion');

	let usuarioId: string | null = null;
	let rol: string | null = null;
	let loggedIn = false;

	if (sesionRaw) {
		try {
			const payload = JSON.parse(sesionRaw) as {
				usuarioId: string;
				rol: string;
				exp: number;
			};
			if (payload.exp && Date.now() > payload.exp) {
				cookies.delete('pod_sesion', { path: '/' });
				cookies.delete('pod_rol', { path: '/' });
			} else {
				usuarioId = payload.usuarioId;
				rol = payload.rol;
				loggedIn = true;
			}
		} catch {
			// Sesión corrupta: limpiar cookies
			cookies.delete('pod_sesion', { path: '/' });
			cookies.delete('pod_rol', { path: '/' });
		}
	}

	event.locals.usuarioId = usuarioId ?? undefined;
	event.locals.rol = rol ?? undefined;
	event.locals.loggedIn = loggedIn;

	// Rutas públicas de auth: permiten registro/login sin sesión previa
	const esAuthPublico = event.url.pathname.startsWith('/api/v1/auth/') &&
		(event.request.method === 'POST' || event.url.pathname.endsWith('/sesion'));

	// Proteger escritura en API: solo lecturas GET sin sesión
	if (event.url.pathname.startsWith('/api/v1/') && !loggedIn && event.request.method !== 'GET' && !esAuthPublico) {
		return new Response(
			JSON.stringify({
				type: 'about:blank',
				title: 'No autenticado',
				status: 401,
				detail: 'Inicie sesión para realizar esta operación.'
			}),
			{
				status: 401,
				headers: { 'content-type': 'application/problem+json' }
			}
		);
	}

	return resolve(event);
};
