import { describe, it, expect, vi, afterEach } from 'vitest';
import { construirPublicacion, tipoDesdeUrl, type FormPublicar } from './publicar';

const base: FormPublicar = {
	zona_id: 'zona-demo',
	titulo: 'Gasfitero de turno',
	descripcion: 'Arreglo fugas.',
	categoria: 'gasfiteria',
	tipo_favor: 'necesidad',
	categoria_favor: 'otro',
	tipo_alerta: 'zona_inundada',
	lat_aprox: -12.046,
	lng_aprox: -77.043
};

describe('Paso 4 · construirPublicacion', () => {
	it('servicio válido va a /servicios', () => {
		const p = construirPublicacion('servicio', base);
		expect(p).toMatchObject({
			ok: true,
			entidad: 'servicios',
			body: { categoria: 'gasfiteria', titulo: 'Gasfitero de turno' }
		});
	});

	it('favor válido va a /favores', () => {
		expect(construirPublicacion('favor', base)).toMatchObject({
			ok: true,
			entidad: 'favores',
			body: { tipo: 'necesidad', categoria: 'otro' }
		});
	});

	it('alerta usa el título si no hay descripción', () => {
		const p = construirPublicacion('alerta', { ...base, descripcion: '' });
		expect(p).toMatchObject({
			ok: true,
			entidad: 'alertas',
			body: { descripcion: 'Gasfitero de turno', tipo: 'zona_inundada' }
		});
	});

	it('errores corregibles antes de encolar', () => {
		expect(construirPublicacion('servicio', { ...base, titulo: 'ab' }).ok).toBe(false);
		expect(construirPublicacion('servicio', { ...base, descripcion: '  ' }).ok).toBe(false);
		expect(construirPublicacion('servicio', { ...base, categoria: 'astronauta' }).ok).toBe(false);
		expect(construirPublicacion('favor', { ...base, tipo_favor: 'robo' }).ok).toBe(false);
		expect(construirPublicacion('alerta', { ...base, titulo: '', descripcion: '' }).ok).toBe(false);
		expect(construirPublicacion('servicio', { ...base, lat_aprox: Number.NaN }).ok).toBe(false);
	});

	it('tipoDesdeUrl', () => {
		expect(tipoDesdeUrl('favor')).toBe('favor');
		expect(tipoDesdeUrl('xyz')).toBe('servicio');
		expect(tipoDesdeUrl(null)).toBe('servicio');
	});
});

describe('Paso 4 · sin señal se guarda en la cola', () => {
	afterEach(() => vi.unstubAllGlobals());

	it('encolarAccion guarda la operación y no llama a la red', async () => {
		vi.stubGlobal('navigator', { onLine: false });
		const fetchSpy = vi.fn();
		vi.stubGlobal('fetch', fetchSpy);
		const { encolarAccion } = await import('../sync/outbox.svelte');
		const { outboxDAO } = await import('../datos/outbox');
		const p = construirPublicacion('favor', base);
		if (!p.ok) throw new Error(p.error);
		const opId = await encolarAccion(p.entidad, p.body);
		const pendientes = await outboxDAO.pendientes();
		const op = pendientes.find((o) => o.op_id === opId);
		expect(op).toMatchObject({
			entidad: 'favores',
			estado: 'pendiente',
			payload: { titulo: 'Gasfitero de turno' }
		});
		expect(fetchSpy).not.toHaveBeenCalled();
	});
});
