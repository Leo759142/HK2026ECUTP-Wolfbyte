import { writable, get } from 'svelte/store';
import { outboxDAO, type OperacionOutbox } from '../datos/outbox';
import { iniciarAutoSync, vaciarColaOutbox } from './motor';
import { AnunciadorAccesible } from '../accesibilidad/anunciador';

export const operacionesOutbox = writable<OperacionOutbox[]>([]);
export const sincronizando = writable(false);

const anunciador = new AnunciadorAccesible();
let iniciado = false;

export async function refrescarOutbox() {
	operacionesOutbox.set(await outboxDAO.pendientes());
}

export async function encolarAccion(entidad: string, payload: unknown, operacion: 'crear' | 'actualizar' = 'crear') {
	const op = await outboxDAO.encolar({ op_id: crypto.randomUUID(), entidad, operacion, payload });
	anunciador.vocalizar('Publicación guardada localmente. Se enviará al recuperar cobertura.', 'polite');
	await refrescarOutbox();
	if (typeof navigator !== 'undefined' && navigator.onLine) void sincronizarAhora();
	return op.op_id;
}

export async function sincronizarAhora() {
	if (get(sincronizando)) return;
	sincronizando.set(true);
	try {
		const r = await vaciarColaOutbox();
		if (r.enviadas) anunciador.vocalizar(`${r.enviadas} cambio(s) sincronizado(s).`, 'polite');
	} finally {
		sincronizando.set(false);
		await refrescarOutbox();
	}
}

/** Fachada compatible con el nombre legacy usado en el dominio/sync anterior. */
export class OutboxComunitario {
	get mutaciones() {
		return get(operacionesOutbox).map((o) => ({
			id: o.op_id,
			accion: o.entidad,
			payload: typeof o.payload === 'string' ? o.payload : JSON.stringify(o.payload),
			estadoOffline: (o.estado === 'aplicada' ? 'Enviada' : 'Pendiente de enviar') as 'Pendiente de enviar' | 'Enviada',
			creadoEn: Date.parse(o.creado_en)
		}));
	}
	get longitud() {
		return get(operacionesOutbox).length;
	}
	encolarAccion(accion: string, payload: unknown) {
		void encolarAccion(accion, payload);
	}
	removerMutacion(_id: string) {
		/* aplicado por motor */
	}
}

export function iniciarOutbox() {
	if (iniciado || typeof window === 'undefined') return;
	iniciado = true;
	iniciarAutoSync();
	void refrescarOutbox();
}
