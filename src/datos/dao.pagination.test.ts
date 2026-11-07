import { describe, it, expect, beforeEach } from 'vitest';
import { dao } from './dao';

beforeEach(async () => {
	// Limpia entidades de prueba entre tests
	for (const id of ['pag-t1', 'pag-t2', 'pag-t3', 'pag-t4', 'pag-t5']) {
		await dao.eliminarLocal('test_entidad', id);
	}
});

describe('DAO paginación', () => {
	it('contarLocal devuelve el total de elementos', async () => {
		for (const i of [1, 2, 3]) {
			await dao.aplicarLocal('test_entidad', { id: `pag-t${i}`, titulo: `Item ${i}` });
		}
		const total = await dao.contarLocal('test_entidad');
		expect(total).toBeGreaterThanOrEqual(3);
	});

	it('listarLocalPaginado respeta límite y offset', async () => {
		await dao.eliminarLocal('test_entidad', 'pag-t1');
		await dao.eliminarLocal('test_entidad', 'pag-t2');
		await dao.eliminarLocal('test_entidad', 'pag-t3');
		for (const i of [1, 2, 3, 4, 5]) {
			await dao.aplicarLocal('test_entidad', { id: `pag-t${i}`, titulo: `Item ${i}` });
		}
		const primera = await dao.listarLocalPaginado('test_entidad', { limite: 2, offset: 0 });
		expect(primera.items.length).toBeLessThanOrEqual(2);
		expect(primera.total).toBeGreaterThanOrEqual(5);
		const segunda = await dao.listarLocalPaginado('test_entidad', { limite: 2, offset: 2 });
		const idsPrimera = new Set(primera.items.map((i) => i.id));
		const idsSegunda = new Set(segunda.items.map((i) => i.id));
		for (const id of idsSegunda) {
			expect(idsPrimera.has(id)).toBe(false);
		}
	});

	it('listarLocalPaginado sin límites devuelve todo', async () => {
		await dao.aplicarLocal('test_entidad', { id: 'pag-t99', titulo: 'Único' });
		const todo = await dao.listarLocalPaginado('test_entidad', {});
		expect(todo.items.length).toBeGreaterThanOrEqual(1);
		expect(todo.total).toBeGreaterThanOrEqual(1);
	});
});