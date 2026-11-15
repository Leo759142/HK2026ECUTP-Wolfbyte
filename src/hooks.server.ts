import type { Handle } from '@sveltejs/kit/hooks';
import type { RequestEvent } from '@sveltejs/kit';

type Sesion = { usuarioId?: string; rol?: string; exp?: number };

const ventanaMs = 60_000;
const limiteEscrituras = 30;
const intentos = new Map<string, { inicio: number; total: number }>();

function cliente(event: RequestEvent): string {
	return event.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
}

function autenticacionValida(cookies: RequestEvent['cookies']): Sesion | null {
	const raw = cookies.get('pod_sesion');
	if (!raw) return null;
	try {
		const sesion = JSON.parse(raw) as Sesion;
		return sesion.exp && sesion.exp > Date.now() ? sesion : null;
	} catch {
		return null;
	}
}

export const handle: Handle = async ({ event, resolve }) => {
	const metodoMutante = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(event.request.method);
	const esApi = event.url.pathname.startsWith('/api/');
	const clave = `${cliente(event)}:${event.url.pathname}`;

	if (metodoMutante && esApi) {
		const ahora = Date.now();
		const actual = intentos.get(clave);
		const registro =
			!actual || ahora - actual.inicio >= ventanaMs ? { inicio: ahora, total: 0 } : actual;
		registro.total += 1;
		intentos.set(clave, registro);
		if (registro.total > limiteEscrituras) {
			return new Response(
				JSON.stringify({
					type: 'about:blank',
					title: 'Límite excedido',
					status: 429,
					detail: 'Demasiadas escrituras. Espera un minuto e inténtalo nuevamente.'
				}),
				{
					status: 429,
					headers: {
						'content-type': 'application/problem+json',
						'retry-after': '60'
					}
				}
			);
		}
	}

	const sesion = autenticacionValida(event.cookies);
	const headers = new Headers(event.request.headers);
	// El rol enviado por el navegador nunca tiene prioridad sobre la cookie de sesión.
	headers.delete('x-rol');
	const rolSesion = sesion?.rol ?? event.cookies.get('pod_rol');
	if (rolSesion) headers.set('x-rol', rolSesion);

	const response = await resolve({
		...event,
		request: new Request(event.request, { headers })
	});
	response.headers.set('x-content-type-options', 'nosniff');
	response.headers.set('x-frame-options', 'DENY');
	response.headers.set('referrer-policy', 'strict-origin-when-cross-origin');
	response.headers.set(
		'content-security-policy-report-only',
		"default-src 'self'; img-src 'self' data: blob: https:; connect-src 'self' https://wa.me; frame-ancestors 'none'"
	);
	return response;
};
