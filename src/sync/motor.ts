import { outboxDAO } from '../datos/dao';

async function fetchConIdempotencia(path: string, payload: unknown, opId: string): Promise<Response | null> {
	return fetch(path, {
		method: 'POST',
		headers: { 'content-type': 'application/json; charset=utf-8', 'Idempotency-Key': opId },
		body: JSON.stringify(payload)
	}).catch(() => null);
}

let _syncing = false;
export async function vaciarColaOutbox(): Promise<{ enviadas: number; pendientes: number; conflicto: boolean }> {
	const run = async (): Promise<{ enviadas: number; pendientes: number; conflicto: boolean }> => {
		if (_syncing) return { enviadas: 0, pendientes: 0, conflicto: false };
		if (typeof navigator !== 'undefined' && !navigator.onLine) return { enviadas: 0, pendientes: 0, conflicto: false };
		_syncing = true;
		let enviadas = 0;
		let conflicto = false;
		try {
			for (const op of await outboxDAO.pendientes()) {
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
					await outboxDAO.marcar(op.op_id, 'rechazada', await res.text().catch(() => String(res.status)));
				} else {
					await outboxDAO.programarReintento(op.op_id, Math.min(30000, 1000 * 2 ** Math.min(op.intentos, 5)), res ? `HTTP ${res.status}` : 'sin red');
					break;
				}
			}
		} finally {
			_syncing = false;
		}
		const pendientes = (await outboxDAO.pendientes()).length;
		return { enviadas, pendientes, conflicto };
	};
	if (typeof navigator !== 'undefined' && 'locks' in navigator) {
		return (navigator as any).locks.request('outbox-sync', run);
	}
	return run();
}

export function iniciarAutoSync() {
	if (typeof window === 'undefined') return;
	window.addEventListener('online', () => void vaciarColaOutbox());
	void vaciarColaOutbox();
}
