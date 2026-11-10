import { describe, it, expect, beforeEach } from 'vitest';
import { reiniciarStore } from '../_store';

function cookiesDe(sesion: { usuarioId: string; rol: string }) {
	const valor = encodeURIComponent(JSON.stringify({ ...sesion, exp: Date.now() + 24 * 60 * 60 * 1000 }));
	return { get: (nombre: string) => (nombre === 'pod_sesion' ? valor : undefined) };
}
function urlDe(path: string) {
	return new URL(`http://localhost${path}`);
}

describe('ISO 25010 — Funcional RF21/RF22 (Anuncios y notificaciones)', () => {
	beforeEach(() => reiniciarStore());

	it('Emprendedor crea anuncio y genera notificación', async () => {
		const { POST: pA } = await import('./anuncios/+server.ts');
		const r1 = await (pA as any)({
			request: new Request('http://localhost/api/v1/anuncios', {
				method: 'POST',
				headers: { 'content-type': 'application/json', 'idempotency-key': 'an1' },
				body: JSON.stringify({ zona_id: 'z1', titulo: 'Descuento bodega', descripcion: '2x1 arroz' })
			}),
			cookies: cookiesDe({ usuarioId: 'u-emprendedor', rol: 'emprendedor' }),
			url: urlDe('/api/v1/anuncios')
		});
		expect(r1.status).toBe(201);

		const { GET: gN } = await import('./notificaciones/+server.ts');
		const r2 = await (gN as any)({
			cookies: cookiesDe({ usuarioId: 'u-vecino', rol: 'vecino' }),
			url: urlDe('/api/v1/notificaciones?no_leidos=1')
		});
		expect(r2.status).toBe(200);
		const c2 = await r2.json();
		expect(c2.no_leidos).toBeGreaterThanOrEqual(1);
	});
});