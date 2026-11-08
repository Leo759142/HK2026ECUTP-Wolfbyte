import { describe, it, expect } from 'vitest';
import { dao, outboxDAO } from './dao';
import { CifradoLocalMejora } from '../seguridad/cifradolocalmejora';

describe('DAO/outbox unificado', () => {
	it('aplica y obtiene local', async () => {
		await dao.aplicarLocal('servicios', { id: 't1', zona_id: 'z1', titulo: 'Test' });
		const s = await dao.obtenerLocal<any>('servicios', 't1');
		expect(s?.id).toBe('t1');
	});

	it('encola y marca aplicada', async () => {
		await dao.encolar({
			op_id: 'op_test_1',
			entidad: 'servicios',
			operacion: 'crear',
			payload: { id: 't1' }
		});
		const pend = await dao.pendientes();
		expect(pend.some((p) => p.id === 'op_test_1')).toBe(true);
		await dao.marcar('op_test_1', 'aplicada');
		const pend2 = await outboxDAO.pendientes();
		expect(pend2.some((p) => p.op_id === 'op_test_1')).toBe(false);
	});
});

describe('Cipher legacy', () => {
	it('roundtrip sync', () => {
		const packed = CifradoLocalMejora.empaquetarDatoSensible('1234');
		expect(CifradoLocalMejora.desempaquetarDatoSensible(packed)).toBe('1234');
	});
	it('roundtrip async', async () => {
		const packed = await CifradoLocalMejora.empaquetar('secreto');
		expect(await CifradoLocalMejora.desempaquetar(packed)).toBe('secreto');
	});
});
