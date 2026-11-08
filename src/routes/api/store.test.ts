import { describe, it, expect, beforeEach } from 'vitest';
import { store, reiniciarStore } from './_store';
import { llamar, clave } from './_test-utils';
import * as favores from './v1/favores/+server';
import * as confirmaciones from './v1/favores/[id]/confirmaciones/+server';
import * as servicios from './v1/servicios/+server';
import * as recomendaciones from './v1/servicios/[id]/recomendaciones/+server';
import * as alertas from './v1/alertas/+server';
import * as emergencias from './v1/emergencias/+server';
import * as sync from './v1/sync/+server';
import { obtenerAlmacenKV } from '../../datos/almacen';

// SvelteKit solo acepta estas exportaciones en un +server.ts (o nombres con "_").
const EXPORTS_VALIDOS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD', 'fallback', 'prerender', 'trailingSlash', 'config', 'entries'];

describe('Paso 1 · arranque', () => {
	beforeEach(() => reiniciarStore());

	it('los +server.ts solo exportan handlers válidos', () => {
		const modulos = { favores, confirmaciones, servicios, recomendaciones, alertas, emergencias, sync };
		for (const [nombre, mod] of Object.entries(modulos)) {
			const invalidos = Object.keys(mod).filter((k) => !EXPORTS_VALIDOS.includes(k) && !k.startsWith('_'));
			expect(invalidos, `exportaciones inválidas en ${nombre}`).toEqual([]);
		}
	});

	it('el almacén en memoria es compartido entre endpoints', async () => {
		const r = await llamar(favores.GET, '/api/v1/favores');
		expect(r.status).toBe(200);
		expect((r.json.items as unknown[]).length).toBe(store.favores.length);
		store.favores.push({ ...store.favores[0], id: 'f-nuevo' });
		const r2 = await llamar(favores.GET, '/api/v1/favores');
		expect((r2.json.items as Array<{ id: string }>).some((f) => f.id === 'f-nuevo')).toBe(true);
	});

	it('reiniciarStore vuelve a las semillas', () => {
		store.alertas.push({ id: 'x' });
		reiniciarStore();
		expect(store.alertas).toEqual([]);
		expect(store.favores.map((f) => f.id)).toEqual(['f1', 'f2']);
	});

	it('$app/environment resuelve y fuera del navegador usa memoria', async () => {
		const kv = obtenerAlmacenKV();
		await kv.set('prueba', 1);
		expect(await kv.get('prueba')).toBe(1);
	});

	it('POST de servicios usa el mismo almacén', async () => {
		const antes = store.servicios.length;
		const r = await llamar(servicios.POST, '/api/v1/servicios', {
			headers: { 'Idempotency-Key': clave() },
			body: { zona_id: 'z1', categoria: 'otro', titulo: 'Clases de guitarra', descripcion: 'Sábados.', lat_aprox: -12.05, lng_aprox: -77.04 }
		});
		expect(r.status).toBe(201);
		expect(store.servicios.length).toBe(antes + 1);
	});
});
