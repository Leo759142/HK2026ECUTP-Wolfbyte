import { describe, it, expect, beforeEach } from 'vitest';
import { store, reiniciarStore, USUARIOS_DEMO } from './_store';
import { llamar, clave } from './_test-utils';
import { POST as confirmar } from './v1/favores/[id]/confirmaciones/+server';
import { accionesCierre, construirConfirmacion } from '../../lib/favores';

const ruta = (id: string) => `/api/v1/favores/${id}/confirmaciones`;
const enviar = (id: string, body: unknown, key = clave()) =>
	llamar(confirmar, ruta(id), { params: { id }, headers: { 'Idempotency-Key': key }, body });

describe('Paso 2 · "Se cumplió" cierra el favor', () => {
	beforeEach(() => reiniciarStore());

	it('cierra cuando confirman solicitante y ayudante', async () => {
		const r1 = await enviar('f2', {
			rol_en_favor: 'solicitante',
			metodo: 'boton',
			usuario_id: USUARIOS_DEMO.solicitante
		});
		expect(r1.status).toBe(201);
		expect(r1.json.favor_estado).toBe('en_curso');
		const r2 = await enviar('f2', {
			rol_en_favor: 'ayudante',
			metodo: 'boton',
			usuario_id: USUARIOS_DEMO.ayudante
		});
		expect(r2.status).toBe(201);
		expect(r2.json.favor_estado).toBe('cerrado');
		expect(store.favores.find((f) => f.id === 'f2')?.cerrado_en).toBeTruthy();
	});

	it('404 si el favor no existe', async () => {
		const r = await enviar('no-existe', {
			rol_en_favor: 'solicitante',
			metodo: 'boton',
			usuario_id: 'u4'
		});
		expect(r.status).toBe(404);
	});

	it('422 si el rol o el método no son válidos', async () => {
		expect(
			(await enviar('f2', { rol_en_favor: 'jefe', metodo: 'boton', usuario_id: 'u4' })).status
		).toBe(422);
		expect(
			(await enviar('f2', { rol_en_favor: 'solicitante', metodo: 'telepatia', usuario_id: 'u4' }))
				.status
		).toBe(422);
		expect((await enviar('f2', { rol_en_favor: 'solicitante', metodo: 'boton' })).status).toBe(422);
	});

	it('403 si el usuario no corresponde al rol', async () => {
		const r = await enviar('f2', {
			rol_en_favor: 'solicitante',
			metodo: 'boton',
			usuario_id: USUARIOS_DEMO.ayudante
		});
		expect(r.status).toBe(403);
		expect(store.confirmaciones).toHaveLength(0);
	});

	it('409 si el favor no tiene ayudante', async () => {
		const r = await enviar('f1', {
			rol_en_favor: 'solicitante',
			metodo: 'boton',
			usuario_id: 'u1'
		});
		expect(r.status).toBe(409);
	});

	it('repetir la misma Idempotency-Key no duplica', async () => {
		const key = clave();
		const body = {
			rol_en_favor: 'solicitante',
			metodo: 'boton',
			usuario_id: USUARIOS_DEMO.solicitante
		};
		await enviar('f2', body, key);
		const r = await enviar('f2', body, key);
		expect(r.status).toBe(200);
		expect(r.headers.get('Idempotent-Replayed')).toBe('true');
		expect(store.confirmaciones).toHaveLength(1);
	});
});

describe('Paso 2 · helpers de UI', () => {
	it('accionesCierre según estado', () => {
		expect(accionesCierre({ estado: 'en_curso', ayudante_id: 'u2' })).toBe('confirmar');
		expect(accionesCierre({ estado: 'abierto', ayudante_id: null })).toBe('esperando_ayudante');
		expect(accionesCierre({ estado: 'cerrado', ayudante_id: 'u2' })).toBe('cerrado');
	});

	it('construirConfirmacion usa el usuario del rol', () => {
		const f = { id: 'f2', creador_id: 'u4', ayudante_id: 'u2' };
		const sol = JSON.parse(construirConfirmacion(f, 'solicitante', 'k-12345678').init.body);
		const ayu = JSON.parse(construirConfirmacion(f, 'ayudante', 'k-12345678').init.body);
		expect(sol).toMatchObject({ rol_en_favor: 'solicitante', usuario_id: 'u4', metodo: 'boton' });
		expect(ayu).toMatchObject({ rol_en_favor: 'ayudante', usuario_id: 'u2' });
	});
});
