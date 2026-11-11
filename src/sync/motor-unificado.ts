/**
 * Motor de sincronización unificado (RF17/RF18).
 * - Usa OutboxDAO como cola única.
 * - Aplica políticas por entidad antes de escribir localmente.
 * - Idempotencia por op_id/Idempotency-Key.
 * - Backoff exponencial con jitter.
 * - Locks con navigator.locks para evitar carreras entre pestañas.
 */
import { outboxDAO, type OperacionOutbox } from '../datos/outbox';
import { obtenerPoliticaSync, esAppendOnly, esServidorManda } from '../dominio/sync/politicas';
import type { EstrategiaSync } from '../dominio/tipos/tipos';

export interface ResultadoSync {
	enviadas: number;
	pendientes: number;
	conflicto: boolean;
}

/** Espera antes del siguiente reintento: 1s, 2s, 4s… hasta 30s. */
export function esperaReintento(intentos: number): number {
	return Math.min(30000, 1000 * 2 ** Math.min(Math.max(intentos, 0), 5));
}

const sinConnection = () => typeof navigator !== 'undefined' && navigator.onLine === false;

async function fetchConIdempotencia(
	path: string,
	payload: unknown,
	opId: string
): Promise<Response | null> {
	return fetch(path, {
		method: 'POST',
		headers: { 'content-type': 'application/json; charset=utf-8', 'Idempotency-Key': opId },
		body: JSON.stringify(payload)
	}).catch(() => null);
}

/** Aplica una operación localmente según su política de sync. */
export async function aplicarLocalmente(
	op: OperacionOutbox
): Promise<{ aplicada: boolean; motivo?: string }> {
	const politica = obtenerPoliticaSync(op.entidad);

	if (esServidorManda(op.entidad)) {
		return { aplicada: false, motivo: 'servidor_manda: el cliente no puede cambiar el estado' };
	}

	if (esAppendOnly(op.entidad) && op.operacion !== ' crear') {
		return {
			aplicada: false,
			motivo: `append_only: ${op.entidad} solo permite crear, no ${op.operacion}`
		};
	}

	return { aplicada: true };
}

async function contarPendientes(): Promise<number> {
	const ops = await outboxDAO.listarTodas();
	return ops.filter((o) => o.estado === 'pendiente' || o.estado === 'enviando').length;
}

let _syncing = false;
export async function vaciarColaOutbox(): Promise<ResultadoSync> {
	const run = async (): Promise<ResultadoSync> => {
		if (_syncing || sinConnection())
			return { enviadas: 0, pendientes: await contarPendientes(), conflicto: false };
		_syncing = true;
		let enviadas = 0;
		let conflicto = false;
		try {
			const ops = await outboxDAO.pendientes();
			for (const op of ops) {
				// Verificar política local antes de enviar
				const aplicacion = await aplicarLocalmente(op);
				if (!aplicacion.aplicada) {
					await outboxDAO.marcar(
						op.op_id,
						'rechazada',
						aplicacion.motivo ?? 'política de sync no permite'
					);
					continue;
				}

				await outboxDAO.marcar(op.op_id, 'enviando');
				const path = op.entidad.startsWith('/') ? op.entidad : `/api/v1/${op.entidad}`;
				const res = await fetchConIdempotencia(path, op.payload, op.op_id);

				if (res?.ok) {
					await outboxDAO.marcar(op.op_id, 'aplicada');
					enviadas++;
				} else if (res?.status === 409) {
					await outboxDAO.marcar(op.op_id, 'conflicto', await res.text().catch(() => 'conflicto'));
					conflicto = true;
				} else if (res && res.status >= 400 && res.status < 500) {
					await outboxDAO.marcar(
						op.op_id,
						'rechazada',
						await res.text().catch(() => String(res.status))
					);
				} else {
					await outboxDAO.programarReintento(
						op.op_id,
						esperaReintento(op.intentos),
						res ? `HTTP ${res.status}` : 'sin red'
					);
					break;
				}
			}
		} finally {
			_syncing = false;
		}
		return { enviadas, pendientes: await contarPendientes(), conflicto };
	};

	const nav =
		typeof navigator !== 'undefined'
			? (navigator as Navigator & { locks?: LockManager })
			: undefined;
	if (nav?.locks) return nav.locks.request('outbox-sync', () => run());
	return run();
}

export function iniciarAutoSync() {
	if (typeof window === 'undefined') return;
	window.addEventListener('online', () => void vaciarColaOutbox());
	void vaciarColaOutbox();
}