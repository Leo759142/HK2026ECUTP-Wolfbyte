import { describe, it, expect, beforeEach } from 'vitest';
import { ServicioRepoLocal } from './servicio.local';
import { dao } from '../datos/dao';

beforeEach(async () => {
	for (const i of [1, 2, 3, 4, 5]) {
		await dao.eliminarLocal('servicios', `svc-pag-${i}`);
	}
});

describe('ServicioRepoLocal paginación', () => {
	it('listar con límite devuelve como máximo esa cantidad', async () => {
		for (const i of [1, 2, 3, 4, 5]) {
			await dao.aplicarLocal('servicios', {
				id: `svc-pag-${i}`,
				zona_id: 'z1',
				categoria: 'gasfiteria',
				titulo: `Servicio ${i}`,
				descripcion: 'Desc',
				usuario_id: 'u1',
				lat_aprox: -12.05,
				lng_aprox: -77.04,
				creado_en: new Date().toISOString(),
				actualizado_en: new Date().toISOString()
			});
		}
		const repo = new ServicioRepoLocal();
		const pagina = await repo.listar({ zona_id: 'z1' }, { limite: 2, offset: 0 });
		expect(pagina.length).toBeLessThanOrEqual(2);
		for (const i of [1, 2, 3, 4, 5]) {
			await dao.eliminarLocal('servicios', `svc-pag-${i}`);
		}
	});

	it('listar con offset no repite elementos de la página anterior', async () => {
		for (const i of [1, 2, 3]) {
			await dao.aplicarLocal('servicios', {
				id: `svc-pag-${i}`,
				zona_id: 'z1',
				categoria: 'gasfiteria',
				titulo: `Servicio ${i}`,
				descripcion: 'Desc',
				usuario_id: 'u1',
				lat_aprox: -12.05,
				lng_aprox: -77.04,
				creado_en: new Date().toISOString(),
				actualizado_en: new Date().toISOString()
			});
		}
		const repo = new ServicioRepoLocal();
		const p1 = await repo.listar({ zona_id: 'z1' }, { limite: 1, offset: 0 });
		const p2 = await repo.listar({ zona_id: 'z1' }, { limite: 1, offset: 1 });
		expect(p1[0]?.id).not.toBe(p2[0]?.id);
		for (const i of [1, 2, 3]) {
			await dao.eliminarLocal('servicios', `svc-pag-${i}`);
		}
	});
});