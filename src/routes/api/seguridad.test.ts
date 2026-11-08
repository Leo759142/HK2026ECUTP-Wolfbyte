import { describe, it, expect, beforeEach } from 'vitest';
import { store, reiniciarStore } from './_store';
import { llamar, clave } from './_test-utils';
import { coordenadasValidas, errorTextos, elegir } from './_validar';
import * as favores from './v1/favores/+server';
import * as servicios from './v1/servicios/+server';
import * as alertas from './v1/alertas/+server';
import * as emergencias from './v1/emergencias/+server';
import { POST as recomendar } from './v1/servicios/[id]/recomendaciones/+server';
import { validarCoordenadas } from '../../dominio/tipos/geohash';

const post = (
	h: Parameters<typeof llamar>[0],
	ruta: string,
	body: unknown,
	headers: Record<string, string> = {}
) => llamar(h, ruta, { headers: { 'Idempotency-Key': clave(), ...headers }, body });

const favorOk = {
	zona_id: 'z1',
	tipo: 'necesidad',
	categoria: 'otro',
	titulo: 'Necesito ayuda',
	descripcion: 'Mover un ropero.',
	lat_aprox: -12.0461,
	lng_aprox: -77.0432
};
const servicioOk = {
	zona_id: 'z1',
	categoria: 'otro',
	titulo: 'Clases de guitarra',
	descripcion: 'Sábados.',
	lat_aprox: -12.05,
	lng_aprox: -77.04
};
const alertaOk = {
	zona_id: 'z1',
	tipo: 'zona_inundada',
	descripcion: 'Agua en la calle 3.',
	lat_aprox: -12.05,
	lng_aprox: -77.04
};

describe('Paso 3 · lista blanca', () => {
	beforeEach(() => reiniciarStore());

	it('favores: el cliente no puede fijar estado, oculto, creador ni id', async () => {
		const r = await post(favores.POST, '/api/v1/favores', {
			...favorOk,
			estado: 'cerrado',
			oculto: 1,
			creador_id: 'atacante',
			id: 'f1',
			extra: 'x'
		});
		expect(r.status).toBe(201);
		expect(r.json).toMatchObject({ estado: 'abierto', oculto: 0, creador_id: 'demo' });
		expect(r.json.id).not.toBe('f1');
		expect(r.json).not.toHaveProperty('extra');
	});

	it('alertas: no se puede marcar como verificada ni oculta', async () => {
		const r = await post(alertas.POST, '/api/v1/alertas', {
			...alertaOk,
			estado: 'confirmado_vecinos',
			oculto: 1,
			usuario_id: 'otro'
		});
		expect(r.json).toMatchObject({ estado: 'sin_verificar', oculto: 0, usuario_id: 'demo' });
	});

	it('emergencias: activada_por y activa los pone el servidor', async () => {
		const r = await post(
			emergencias.POST,
			'/api/v1/emergencias',
			{
				zona_id: 'z1',
				tipo: 'inundacion',
				titulo: 'Desborde del río',
				activa: 0,
				activada_por: 'Vecino'
			},
			{ 'x-rol': 'Coordinador de emergencia' }
		);
		expect(r.status).toBe(201);
		expect(r.json).toMatchObject({ activa: 1, activada_por: 'Coordinador de emergencia' });
	});

	it('servicios: usuario_id y activo los pone el servidor', async () => {
		const r = await post(servicios.POST, '/api/v1/servicios', {
			...servicioOk,
			usuario_id: 'otro',
			activo: 0,
			oculto: 1
		});
		expect(r.json).toMatchObject({ usuario_id: 'demo', activo: 1, oculto: 0 });
	});

	it('las coordenadas se guardan enmascaradas', async () => {
		const r = await post(favores.POST, '/api/v1/favores', favorOk);
		expect(r.json).toMatchObject({ lat_aprox: -12.046, lng_aprox: -77.043 });
	});
});

describe('Paso 3 · coordenadas inválidas → 422', () => {
	beforeEach(() => reiniciarStore());

	it.each([
		['NaN', { lat_aprox: 'abc', lng_aprox: -77 }],
		['fuera de rango', { lat_aprox: 120, lng_aprox: -77 }],
		['lng fuera de rango', { lat_aprox: -12, lng_aprox: 200 }],
		['incompletas', { lat_aprox: -12 }],
		['texto vacío', { lat_aprox: '', lng_aprox: '' }]
	])('favores con coordenadas %s', async (_n, coords) => {
		const { lat_aprox: _a, lng_aprox: _b, ...base } = favorOk;
		const r = await post(favores.POST, '/api/v1/favores', { ...base, ...coords });
		expect(r.status).toBe(422);
	});

	it('servicios exige coordenadas', async () => {
		const { lat_aprox: _a, lng_aprox: _b, ...sin } = servicioOk;
		expect((await post(servicios.POST, '/api/v1/servicios', sin)).status).toBe(422);
		expect(
			(await post(servicios.POST, '/api/v1/servicios', { ...servicioOk, lat_aprox: Number.NaN }))
				.status
		).toBe(422);
	});

	it('alertas con coordenadas fuera de rango no da 500', async () => {
		expect(
			(await post(alertas.POST, '/api/v1/alertas', { ...alertaOk, lat_aprox: 999 })).status
		).toBe(422);
	});

	it('validarCoordenadas del dominio rechaza NaN', () => {
		expect(() => validarCoordenadas(Number.NaN, 0)).toThrow(RangeError);
		expect(coordenadasValidas(Number.NaN, 0)).toBe(false);
		expect(coordenadasValidas(-12, -77)).toBe(true);
	});
});

describe('Paso 3 · límites de longitud', () => {
	beforeEach(() => reiniciarStore());

	it('títulos y descripciones', async () => {
		expect((await post(favores.POST, '/api/v1/favores', { ...favorOk, titulo: 'ab' })).status).toBe(
			422
		);
		expect(
			(await post(favores.POST, '/api/v1/favores', { ...favorOk, titulo: 'x'.repeat(81) })).status
		).toBe(422);
		expect(
			(
				await post(servicios.POST, '/api/v1/servicios', {
					...servicioOk,
					descripcion: 'x'.repeat(501)
				})
			).status
		).toBe(422);
		expect(
			(await post(alertas.POST, '/api/v1/alertas', { ...alertaOk, descripcion: 'x'.repeat(301) }))
				.status
		).toBe(422);
		expect((await post(favores.POST, '/api/v1/favores', { ...favorOk, titulo: 123 })).status).toBe(
			422
		);
	});

	it('comentario de recomendación hasta 140', async () => {
		const base = { tipo: 'visto_bueno', misma_zona: true, dispositivo_hash: 'abc123' };
		const llamarRec = (body: unknown) =>
			llamar(recomendar, '/api/v1/servicios/s1/recomendaciones', {
				params: { id: 's1' },
				headers: { 'Idempotency-Key': clave() },
				body
			});
		expect((await llamarRec({ ...base, comentario: 'x'.repeat(141) })).status).toBe(422);
		expect((await llamarRec({ ...base, tipo: 'me_gusta' })).status).toBe(422);
		expect((await llamarRec({ ...base, comentario: 'Muy bueno' })).status).toBe(201);
	});

	it('errorTextos y elegir', () => {
		expect(errorTextos({ a: '  ' }, { a: { max: 5 } })).toMatch(/al menos/);
		expect(errorTextos({}, { a: { max: 5, requerido: false } })).toBeNull();
		expect(elegir({ a: ' x ', b: 1 }, ['a'])).toEqual({ a: 'x' });
	});
});

describe('Paso 3 · GET filtra ocultos', () => {
	beforeEach(() => reiniciarStore());

	it('favores, servicios y alertas no devuelven oculto = 1', async () => {
		store.favores[0].oculto = 1;
		store.servicios[0].oculto = 1;
		store.alertas.push(
			{ id: 'a-oculta', zona_id: 'z1', oculto: 1 },
			{ id: 'a-visible', zona_id: 'z1', oculto: 0 }
		);
		const ids = async (h: Parameters<typeof llamar>[0], ruta: string) =>
			((await llamar(h, ruta)).json.items as Array<{ id: string }>).map((x) => x.id);
		expect(await ids(favores.GET, '/api/v1/favores')).toEqual(['f2']);
		expect(await ids(servicios.GET, '/api/v1/servicios')).toEqual(['s2']);
		expect(await ids(alertas.GET, '/api/v1/alertas')).toEqual(['a-visible']);
	});
});
