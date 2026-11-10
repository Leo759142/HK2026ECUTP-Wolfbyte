import { describe, it, expect, beforeEach } from 'vitest';
import { reiniciarStore } from '../_store';

function cookiesDe(sesion: { usuarioId: string; rol: string }) {
	const valor = encodeURIComponent(JSON.stringify({ ...sesion, exp: Date.now() + 24 * 60 * 60 * 1000 }));
	return { get: (nombre: string) => (nombre === 'pod_sesion' ? valor : undefined) };
}
function urlDe(path: string) {
	return new URL(`http://localhost${path}`);
}

describe('ISO 25010 — Funcional RF12/RF13/RF14/RF16 (Emergencia, alertas, punto apoyo, oficiales)', () => {
	beforeEach(() => reiniciarStore());

	it('RF12 activar emergencia solo roles autorizados', async () => {
		const { POST } = await import('./emergencias/+server.ts');
		const r1 = await (POST as any)({
			request: new Request('http://localhost/api/v1/emergencias', {
				method: 'POST',
				headers: { 'content-type': 'application/json', 'idempotency-key': 'em1' },
				body: JSON.stringify({ zona_id: 'z1', tipo: 'sismo', titulo: 'Sismo leve' })
			}),
			cookies: cookiesDe({ usuarioId: 'u-coordinador', rol: 'coordinador' }),
			url: urlDe('/api/v1/emergencias')
		});
		expect(r1.status).toBe(201);

		const r2 = await (POST as any)({
			request: new Request('http://localhost/api/v1/emergencias', {
				method: 'POST',
				headers: { 'content-type': 'application/json', 'idempotency-key': 'em2' },
				body: JSON.stringify({ zona_id: 'z1', tipo: 'otro', titulo: 'Falso' })
			}),
			cookies: cookiesDe({ usuarioId: 'u-vecino', rol: 'vecino' }),
			url: urlDe('/api/v1/emergencias')
		});
		expect(r2.status).toBe(403);

		const { GET } = await import('./emergencias/+server.ts');
		const r3 = await (GET as any)({
			cookies: cookiesDe({ usuarioId: 'u-vecino', rol: 'vecino' }),
			url: urlDe('/api/v1/emergencias?activa=1')
		});
		expect(r3.status).toBe(200);
		const c3 = await r3.json();
		expect(c3.total).toBeGreaterThanOrEqual(1);
	});

	it('RF13 reportar alerta con ubicación aproximada (RF19)', async () => {
		const { POST } = await import('./alertas/+server.ts');
		const r = await (POST as any)({
			request: new Request('http://localhost/api/v1/alertas', {
				method: 'POST',
				headers: { 'content-type': 'application/json', 'idempotency-key': 'al1' },
				body: JSON.stringify({
					zona_id: 'z1',
					tipo: 'zona_inundada',
					descripcion: 'Agua en calle principal',
					lat_aprox: -12.0465,
					lng_aprox: -77.0432
				})
			}),
			cookies: cookiesDe({ usuarioId: 'u-vecino', rol: 'vecino' }),
			url: urlDe('/api/v1/alertas')
		});
		expect(r.status).toBe(201);
		const c = await r.json();
		expect(c.lat_aprox).toBeCloseTo(-12.047, 2);
	});

	it('RF14 punto de apoyo (directorio emergencia)', async () => {
		const { POST } = await import('./punto-apoyo/+server.ts');
		const { GET } = await import('./punto-apoyo/+server.ts');

		const r1 = await (POST as any)({
			request: new Request('http://localhost/api/v1/punto-apoyo', {
				method: 'POST',
				headers: { 'content-type': 'application/json', 'idempotency-key': 'pa1' },
				body: JSON.stringify({ tipo: 'posta_salud', nombre: 'Posta San Juan', zona_id: 'z1', telefono: '999123456' })
			}),
			cookies: cookiesDe({ usuarioId: 'u-referente', rol: 'referente' }),
			url: urlDe('/api/v1/punto-apoyo')
		});
		expect(r1.status).toBe(201);

		const r2 = await (GET as any)({
			cookies: cookiesDe({ usuarioId: 'u-vecino', rol: 'vecino' }),
			url: urlDe('/api/v1/punto-apoyo?tipo=posta_salud')
		});
		expect(r2.status).toBe(200);
		const c2 = await r2.json();
		expect(c2.total).toBeGreaterThanOrEqual(1);
	});

	it('RF16 alertas oficiales (simulada INDECI/SENAMHI)', async () => {
		const { POST } = await import('./alertas-oficiales/+server.ts');
		const { GET } = await import('./alertas-oficiales/+server.ts');

		const r1 = await (POST as any)({
			request: new Request('http://localhost/api/v1/alertas-oficiales', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ fuente: 'SENAMHI', titulo: 'Lluvias intensas', nivel: 'alto', zona_id: 'z1' })
			}),
			cookies: cookiesDe({ usuarioId: 'u-coordinador', rol: 'coordinador' }),
			url: urlDe('/api/v1/alertas-oficiales')
		});
		expect(r1.status).toBe(201);

		const r2 = await (GET as any)({
			cookies: cookiesDe({ usuarioId: 'u-vecino', rol: 'vecino' }),
			url: urlDe('/api/v1/alertas-oficiales')
		});
		expect(r2.status).toBe(200);
		const c2 = await r2.json();
		expect(c2.fuente_simulada).toBe(true);
	});
});