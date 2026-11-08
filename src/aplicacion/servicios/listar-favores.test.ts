import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ListarFavor } from './listar-favores';
import { FavorRepoLocal } from '../../repositorios/favor.local';
import { dao } from '../../datos/dao';
import type { Favor, CategoriaFavor, EstadoFavor, TipoFavor } from '../../dominio/tipos/tipos';

function favorSobre(id: string, estado: EstadoFavor = 'abierto'): Favor {
	return {
		id,
		creador_id: 'u1',
		ayudante_id: null,
		zona_id: 'z1',
		tipo: 'oferta' as TipoFavor,
		categoria: 'prestamo_herramienta' as CategoriaFavor,
		titulo: `Favor ${id}`,
		descripcion: 'Descripción de prueba.',
		estado,
		agradecimiento: null,
		oculto: 0,
		creado_en: new Date().toISOString(),
		cerrado_en: null,
		lat_aprox: -12.046,
		lng_aprox: -77.043
	};
}

const ids = ['f-list-1', 'f-list-2'];

beforeEach(async () => {
	for (const id of ids) await dao.eliminarLocal('favores', id);
});
afterEach(async () => {
	for (const id of ids) await dao.eliminarLocal('favores', id);
});

describe('ListarFavor (servicio + repositorio)', () => {
	it('lista favores y filtra por estado', async () => {
		const repo = new FavorRepoLocal();
		await repo.guardar(favorSobre('f-list-1', 'abierto'));
		await repo.guardar(favorSobre('f-list-2', 'cerrado'));

		const uc = new ListarFavor(repo);

		const abiertos = await uc.ejecutar({ estado: 'abierto' });
		expect(abiertos.map((f) => f.id).sort()).toEqual(['f-list-1']);

		const todos = await uc.ejecutar({});
		expect(todos.length).toBe(2);

		const vacio = await uc.ejecutar({ estado: 'en_curso' });
		expect(vacio).toEqual([]);
	});
});
