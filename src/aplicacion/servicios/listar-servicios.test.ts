import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ListarServicios } from './listar-servicios';
import { ServicioRepoLocal } from '../../repositorios/servicio.local';
import { dao } from '../../datos/dao';
import { Servicio } from '../../dominio/proximidad/servicios';
import type { CategoriaServicio } from '../../dominio/tipos/tipos';

function servicioSobre(id: string, zona_id = 'z1', categoria: CategoriaServicio = 'gasfiteria') {
	return new Servicio({
		id,
		usuario_id: 'u1',
		zona_id,
		categoria,
		titulo: `Servicio ${id}`,
		descripcion: 'Descripción de prueba.',
		lat_aprox: -12.05,
		lng_aprox: -77.04
	});
}

const ids = ['svc-list-1', 'svc-list-2', 'svc-list-3'];

beforeEach(async () => {
	for (const id of ids) await dao.eliminarLocal('servicios', id);
});
afterEach(async () => {
	for (const id of ids) await dao.eliminarLocal('servicios', id);
});

describe('ListarServicios (servicio + repositorio)', () => {
	it('lista los servicios de una zona y aplica filtro de categoría', async () => {
		const repo = new ServicioRepoLocal();
		await repo.guardar(servicioSobre('svc-list-1', 'z1', 'gasfiteria'));
		await repo.guardar(servicioSobre('svc-list-2', 'z1', 'electricidad'));
		await repo.guardar(servicioSobre('svc-list-3', 'z2', 'gasfiteria'));

		const uc = new ListarServicios(repo);

		const zona = await uc.ejecutar({ zona_id: 'z1' });
		expect(zona.map((s) => s.id).sort()).toEqual(['svc-list-1', 'svc-list-2']);

		const cat = await uc.ejecutar({ categoria: 'gasfiteria' });
		expect(cat.map((s) => s.id).sort()).toEqual(['svc-list-1', 'svc-list-3']);

		const vacio = await uc.ejecutar({ zona_id: 'z9' });
		expect(vacio).toEqual([]);
	});
});
