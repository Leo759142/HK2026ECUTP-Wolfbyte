/**
 * Modelo unificado de operación de sincronización (RF17/RF18).
 * Reemplaza los múltiples formatos legacy (OutboxComunitario, dao.ts cola v2, MutacionCola).
 */
import type { EstrategiaSync, OperacionSync, EstadoSyncCola } from '../tipos/tipos';

export type EstadoOperacionUnificada =
	| 'pendiente'
	| 'enviando'
	| 'aplicada'
	| 'rechazada'
	| 'conflicto';

/** Operación completa en la cola de sincronización. */
export interface OperacionUnificada {
	op_id: string;
	entidad: string;
	operacion: OperacionSync;
	payload: unknown;
	idempotencyKey: string;
	estado: EstadoOperacionUnificada;
	intentos: number;
	nextAttemptAt?: number;
	creadoEn: string;
	actualizadoEn: string;
	error?: string | null;
	politicaSync: EstrategiaSync;
}

/** Convierte un EstadoSyncCola legacy a EstadoOperacionUnificada. */
export function aEstadoUnificado(estado: EstadoSyncCola | string): EstadoOperacionUnificada {
	if (estado === 'aplicada') return 'aplicada';
	if (estado === 'rechazada') return 'rechazada';
	if (estado === 'enviando') return 'enviando';
	if (estado === 'conflicto') return 'conflicto';
	return 'pendiente';
}

/** Verdadero si la operación está lista para ser enviada (no hay reintento programado). */
export function estaPendienteDeEnvio(op: OperacionUnificada, ahora = Date.now()): boolean {
	return (
		(op.estado === 'pendiente' || op.estado === 'enviando') &&
		(!op.nextAttemptAt || op.nextAttemptAt <= ahora)
	);
}

/** Verdadero si la operación necesita revisión humana. */
export function requiereAtencion(op: OperacionUnificada): boolean {
	return op.estado === 'rechazada' || op.estado === 'conflicto';
}

/** Crea una operación unificada a partir de sus componentes. */
export function crearOperacionUnificada(input: {
	op_id: string;
	entidad: string;
	operacion: OperacionSync;
	payload: unknown;
	politicaSync: EstrategiaSync;
}): OperacionUnificada {
	const ahora = new Date().toISOString();
	return {
		...input,
		idempotencyKey: input.op_id,
		estado: 'pendiente',
		intentos: 0,
		creadoEn: ahora,
		actualizadoEn: ahora,
		error: null
	};
}