import { describe, it, expect, beforeEach } from 'vitest';
import { outboxDAO } from './outbox';

beforeEach(async () => {
	// Limpia operaciones de prueba
	const pendientes = await outboxDAO.pendientes();
	for (const p of pendientes) {
		if (String(p.op_id).startsWith('op-pag-')) {
			await outboxDAO.marcar(p.op_id, 'aplicada');
		}
	}
});

describe('Outbox paginación', () => {
	it('pendientesPaginado respeta límite y offset', async () => {
		for (const i of [1, 2, 3]) {
			await outboxDAO.encolar({
				op_id: `op-pag-${i}`,
				entidad: 'test_entidad',
				operacion: 'crear',
				payload: { id: `pag-t${i}` }
			});
		}
		const pagina = await outboxDAO.pendientesPaginado({ limite: 2, offset: 0 });
		expect(pagina.items.length).toBeLessThanOrEqual(2);
		expect(pagina.total).toBeGreaterThanOrEqual(3);
		const ids = new Set(pagina.items.map((p) => p.op_id));
		for (const i of [1, 2]) {
			// limpieza de las creadas en este test
			await outboxDAO.marcar(`op-pag-${i}`, 'aplicada');
		}
		await outboxDAO.marcar('op-pag-3', 'aplicada');
	});
});
