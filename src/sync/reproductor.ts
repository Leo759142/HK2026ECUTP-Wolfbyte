import { sincronizarAhora, refrescarOutbox } from './outbox.svelte';
import { outboxDAO } from '../datos/outbox';
import type { MutacionCola } from '../dominio/tipos/tipos';

/** Compatibilidad: usa el motor unificado de outbox/sync. */
export class ReproductorSincronizacion {
	constructor(_outbox?: unknown, _enviarServidor?: (mutacion: MutacionCola) => Promise<boolean>) {}
	async dispararVaciado(): Promise<void> {
		await sincronizarAhora();
	}
}

export async function estadoOutbox() {
	const items = await outboxDAO.pendientes();
	return { pendientes: items.length, items };
}

export { sincronizarAhora, refrescarOutbox };
