import { describe, it, expect, beforeEach } from 'vitest';
import { reiniciarStore, store } from '../_store';
import { enmascararCoordenadas } from '../../../dominio/tipos/geohash';
import { ServicioCierreFavor } from '../../../dominio/favores/cierre';
import { puede } from '../../../dominio/roles/rbac';
import { translate, IDIOMAS } from '../../../i18n';

function cookiesDe(sesion: { usuarioId: string; rol: string }) {
	const valor = encodeURIComponent(JSON.stringify({ ...sesion, exp: Date.now() + 24 * 60 * 60 * 1000 }));
	return { get: (nombre: string) => (nombre === 'pod_sesion' ? valor : undefined) };
}
function urlDe(path: string) {
	return new URL(`http://localhost${path}`);
}

describe('ISO 25010 — RF23/RF24 i18n y RBAC como datos', () => {
	it('translate es/qu', () => {
		expect(translate('es', 'hola')).toBe('¡Hola');
		expect(translate('qu', 'hola')).toBe('¡Allinllachu');
		expect(IDIOMAS).toContain('es');
		expect(IDIOMAS).toContain('qu');
	});

	it('RBAC roles como datos', () => {
		expect(puede('referente', 'moderar_contenido')).toBe(true);
		expect(puede('vecino', 'moderar_contenido')).toBe(false);
		expect(puede('coordinador', 'activar_emergencia')).toBe(true);
		expect(puede('vecino', 'activar_emergencia')).toBe(false);
	});
});

describe('ISO 25010 — RF11 cierre mutuo y RF07 append-only', () => {
	beforeEach(() => reiniciarStore());

	it('Cierre mutuo requiere ambas partes', () => {
		expect(ServicioCierreFavor.evaluarCierreMutuo('f1', 'u1', 'u2', [])).toBe(false);
		expect(
			ServicioCierreFavor.evaluarCierreMutuo('f1', 'u1', 'u2', [
				{ favor_id: 'f1', usuario_id: 'u1', rol_en_favor: 'solicitante', metodo: 'boton' },
				{ favor_id: 'f1', usuario_id: 'u2', rol_en_favor: 'ayudante', metodo: 'boton' }
			])
		).toBe(true);
	});

	it('Visto bueno idempotente (no duplica)', async () => {
		const { POST } = await import('./servicios/[id]/recomendaciones/+server.ts');
		const r1 = await (POST as any)({
			request: new Request('http://localhost/api/v1/servicios/s1/recomendaciones', {
				method: 'POST',
				headers: { 'content-type': 'application/json', 'idempotency-key': 'rb1' },
				body: JSON.stringify({ tipo: 'visto_bueno', misma_zona: true, dispositivo_hash: 'd1', comentario: 'Bien' })
			}),
			cookies: cookiesDe({ usuarioId: 'u-vecino', rol: 'vecino' }),
			params: { id: 's1' },
			url: urlDe('/api/v1/servicios/s1/recomendaciones')
		});
		expect(r1.status).toBe(201);

		const r2 = await (POST as any)({
			request: new Request('http://localhost/api/v1/servicios/s1/recomendaciones', {
				method: 'POST',
				headers: { 'content-type': 'application/json', 'idempotency-key': 'rb1' },
				body: JSON.stringify({ tipo: 'visto_bueno', misma_zona: true, dispositivo_hash: 'd1' })
			}),
			cookies: cookiesDe({ usuarioId: 'u-vecino', rol: 'vecino' }),
			params: { id: 's1' },
			url: urlDe('/api/v1/servicios/s1/recomendaciones')
		});
		expect(r2.status).toBe(200);
		expect((await r2.json()).replayed).toBe(true);
	});
});

describe('ISO 25010 — RF19 ubicación aproximada', () => {
	it('Trunca a 3 decimales', () => {
		const u = enmascararCoordenadas(-12.04655, -77.04322);
		expect(u.lat_aprox).toBe(-12.047);
		expect(u.lng_aprox).toBe(-77.043);
		expect(u.geohash_muro).toBeDefined();
	});
});

describe('ISO 25010 — Fiabilidad RF17/RF18 idempotencia servicios', () => {
	beforeEach(() => reiniciarStore());

	it('Mismo op_id no duplica servicio', async () => {
		const { POST } = await import('./servicios/+server.ts');
		const body = JSON.stringify({
			zona_id: 'z1', categoria: 'gasfiteria', titulo: 'Prueba idem', descripcion: 'D',
			lat_aprox: -12.046, lng_aprox: -77.043
		});
		const r1 = await (POST as any)({
			request: new Request('http://localhost/api/v1/servicios', {
				method: 'POST', headers: { 'content-type': 'application/json', 'idempotency-key': 'idem1' }, body
			}),
			cookies: cookiesDe({ usuarioId: 'u-emprendedor', rol: 'emprendedor' }),
			url: urlDe('/api/v1/servicios')
		});
		expect(r1.status).toBe(201);
		const id1 = (await r1.json()).id;

		const r2 = await (POST as any)({
			request: new Request('http://localhost/api/v1/servicios', {
				method: 'POST', headers: { 'content-type': 'application/json', 'idempotency-key': 'idem1' }, body
			}),
			cookies: cookiesDe({ usuarioId: 'u-emprendedor', rol: 'emprendedor' }),
			url: urlDe('/api/v1/servicios')
		});
		expect(r2.status).toBe(200);
		expect((await r2.json()).id).toBe(id1);
		const duplicados = store.servicios.filter((s) => s.titulo === 'Prueba idem');
		expect(duplicados.length).toBe(1);
	});
});