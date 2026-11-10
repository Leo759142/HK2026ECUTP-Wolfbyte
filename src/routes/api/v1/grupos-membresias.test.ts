import { describe, it, expect, beforeEach } from 'vitest';
import { reiniciarStore } from '../_store';

function cookiesDe(sesion: { usuarioId: string; rol: string }) {
	const valor = encodeURIComponent(JSON.stringify({ ...sesion, exp: Date.now() + 24 * 60 * 60 * 1000 }));
	return { get: (nombre: string) => (nombre === 'pod_sesion' ? valor : undefined) };
}
function urlDe(path: string) {
	return new URL(`http://localhost${path}`);
}

describe('ISO 25010 — Funcional RF02/RF03/RF04 (Grupos, membresías, referente)', () => {
	beforeEach(() => reiniciarStore());

	it('Referente crea grupo y vecino se une (pendiente)', async () => {
		const { POST: pG } = await import('./grupos/+server.ts');
		const { POST: pM } = await import('./grupos/[id]/membresias/+server.ts');

		const r1 = await (pG as any)({
			request: new Request('http://localhost/api/v1/grupos', {
				method: 'POST',
				headers: { 'content-type': 'application/json', 'idempotency-key': 'g1' },
				body: JSON.stringify({ nombre: 'Manzana B', zona_id: 'z1', tipo: 'manzana' })
			}),
			cookies: cookiesDe({ usuarioId: 'u-referente', rol: 'referente' }),
			url: urlDe('/api/v1/grupos')
		});
		expect(r1.status).toBe(201);

		const r2 = await (pM as any)({
			request: new Request('http://localhost/api/v1/grupos/g-zona-1/membresias', { method: 'POST' }),
			cookies: cookiesDe({ usuarioId: 'u-vecino', rol: 'vecino' }),
			params: { id: 'g-zona-1' },
			url: urlDe('/api/v1/grupos/g-zona-1/membresias')
		});
		expect(r2.status).toBe(201);
		const c2 = await r2.json();
		expect(c2.membresia.estado).toBe('pendiente');

		// Referente aprueba (RF04)
		const { PATCH } = await import('./grupos/[id]/membresias/+server.ts');
		const r3 = await (PATCH as any)({
			request: new Request('http://localhost/api/v1/grupos/g-zona-1/membresias', {
				method: 'PATCH',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ membresia_id: c2.membresia.id, accion: 'aprobar' })
			}),
			cookies: cookiesDe({ usuarioId: 'u-referente', rol: 'referente' }),
			params: { id: 'g-zona-1' },
			url: urlDe('/api/v1/grupos/g-zona-1/membresias')
		});
		expect(r3.status).toBe(200);
	});

	it('Vecino no puede aprobar membresía (RF03 RBAC)', async () => {
		const { PATCH } = await import('./grupos/[id]/membresias/+server.ts');
		const r = await (PATCH as any)({
			request: new Request('http://localhost/api/v1/grupos/g-zona-1/membresias', {
				method: 'PATCH',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ membresia_id: 'm1', accion: 'aprobar' })
			}),
			cookies: cookiesDe({ usuarioId: 'u-vecino', rol: 'vecino' }),
			params: { id: 'g-zona-1' },
			url: urlDe('/api/v1/grupos/g-zona-1/membresias')
		});
		expect(r.status).toBe(403);
	});
});