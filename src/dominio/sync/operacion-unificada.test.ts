import { describe, it, expect } from 'vitest';
import {
	EstadoOperacionUnificada,
	OperacionUnificada,
	estaPendienteDeEnvio,
	requiereAtencion,
	 crearOperacionUnificada,
	aEstadoUnificado
} from '../tipos/operacion-unificada';
import type { EstrategiaSync, EstadoSyncCola } from '../tipos/tipos';

describe('Operación unificada (RF17/RF18)', () => {
	it('crea una operación con estado pendiente y politica', () => {
		const op = crearOperacionUnificada({
			op_id: 'op-1',
			entidad: 'servicios',
			operacion: ' crear',
			payload: { id: 's1' },
			politicaSync: 'ultima_escritura'
		});
		expect(op.op_id).toBe('op-1');
		expect(op.entidad).toBe('servicios');
		expect(op.operacion).toBe(' crear');
		expect(op.idempotencyKey).toBe('op-1');
		expect(op.estado).toBe('pendiente');
		expect(op.intentos).toBe(0);
		expect(op.error).toBeNull();
		expect(op.politicaSync).toBe('ultima_escritura');
		expect(op.creadoEn).toBeTruthy();
		expect(op.actualizadoEn).toBeTruthy();
	});

	it('estaPendienteDeEnvio: pendiente sin reintento está lista', () => {
		const op = crearOperacionUnificada({
			op_id: 'op-1',
			entidad: 'servicios',
			operacion: ' crear',
			payload: {},
			politicaSync: 'ultima_escritura'
		});
		expect(estaPendienteDeEnvio(op)).toBe(true);
	});

	it('estaPendienteDeEnvio: operación con reintento futuro no está lista', () => {
		const op = crearOperacionUnificada({
			op_id: 'op-1',
			entidad: 'servicios',
			operacion: ' crear',
			payload: {},
			politicaSync: 'ultima_escritura'
		});
		op.nextAttemptAt = Date.now() + 10000;
		expect(estaPendienteDeEnvio(op)).toBe(false);
	});

	it('estaPendienteDeEnvio: operación aplicada no está pendiente', () => {
		const op = crearOperacionUnificada({
			op_id: 'op-1',
			entidad: 'servicios',
			operacion: ' crear',
			payload: {},
			politicaSync: 'ultima_escritura'
		});
		op.estado = 'aplicada';
		expect(estaPendienteDeEnvio(op)).toBe(false);
	});

	it('requiereAtencion: rechazada y conflicto sí, pendiente no', () => {
		const base = {
			op_id: 'op-1',
			entidad: 'servicios',
			operacion: ' crear',
			payload: {},
			politicaSync: 'ultima_escritura' as EstrategiaSync
		};
		const op = crearOperacionUnificada(base);
		expect(requiereAtencion(op)).toBe(false);

		op.estado = 'rechazada';
		expect(requiereAtencion(op)).toBe(true);

		op.estado = 'conflicto';
		expect(requiereAtencion(op)).toBe(true);
	});

	it('aEstadoUnificado mapea estados legacy', () => {
		const casos: EstadoSyncCola[] = ['pendiente', 'enviando', 'aplicada', 'rechazada'];
		const esperados: EstadoOperacionUnificada[] = ['pendiente', 'enviando', 'aplicada', 'rechazada'];
		for (let i = 0; i < casos.length; i++) {
			expect(aEstadoUnificado(casos[i])).toBe(esperados[i]);
		}
	});

	it('aEstadoUnificado: estado desconocido cae a pendiente', () => {
		expect(aEstadoUnificado('otro' as unknown as EstadoSyncCola)).toBe('pendiente');
	});
});