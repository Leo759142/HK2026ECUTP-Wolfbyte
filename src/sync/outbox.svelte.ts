import { writable, derived, get } from 'svelte/store';
import { outboxDAO, esPendiente, requiereAtencion, type OperacionOutbox } from '../datos/outbox';
import { vaciarColaOutbox } from './motor';
import { AnunciadorAccesible } from '../accesibilidad/anunciador';

/** Todas las operaciones guardadas en el celular (pendientes, con reintento programado, rechazadas…). */
export const operacionesOutbox = writable<OperacionOutbox[]>([]);
export const sincronizando = writable(false);

/** Pendientes de enviar, incluidas las que esperan un reintento programado. */
export const pendientesEnvio = derived(operacionesOutbox, (ops) =>
	ops.filter((o) => esPendiente(o.estado))
);
/** Rechazadas o en conflicto: "Requiere atención". */
export const requierenAtencion = derived(operacionesOutbox, (ops) =>
	ops.filter((o) => requiereAtencion(o.estado))
);

const anunciador = new AnunciadorAccesible();
let iniciado = false;
let timerReintento: ReturnType<typeof setTimeout> | null = null;

export async function refrescarOutbox() {
	operacionesOutbox.set(await outboxDAO.listarTodas());
}

/** Programa un sync para cuando venza el próximo reintento (solo en el navegador). */
export async function programarSiguienteReintento(ahora = Date.now()): Promise<number | null> {
	if (timerReintento) clearTimeout(timerReintento);
	timerReintento = null;
	const proximo = await outboxDAO.proximoReintento();
	if (proximo === null || typeof window === 'undefined')
		return proximo === null ? null : Math.max(0, proximo - ahora);
	const espera = Math.max(0, proximo - ahora) + 50;
	timerReintento = setTimeout(() => void sincronizarAhora(), espera);
	return espera;
}

export async function encolarAccion(
	entidad: string,
	payload: unknown,
	operacion: 'crear' | 'actualizar' = 'crear'
) {
	const op = await outboxDAO.encolar({ op_id: crypto.randomUUID(), entidad, operacion, payload });
	anunciador.vocalizar(
		'Publicación guardada localmente. Se enviará al recuperar cobertura.',
		'polite'
	);
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
		await programarSiguienteReintento();
	}
}

/** El usuario descarta una operación rechazada. */
export async function descartarOperacion(opId: string) {
	await outboxDAO.descartar(opId);
	await refrescarOutbox();
}

/** Fachada compatible con el nombre legacy usado en el dominio/sync anterior. */
export class OutboxComunitario {
	get mutaciones() {
		return get(operacionesOutbox).map((o) => ({
			id: o.op_id,
			accion: o.entidad,
			payload: typeof o.payload === 'string' ? o.payload : JSON.stringify(o.payload),
			estadoOffline: (o.estado === 'aplicada' ? 'Enviada' : 'Pendiente de enviar') as
				'Pendiente de enviar' | 'Enviada',
			creadoEn: Date.parse(o.creado_en)
		}));
	}
	get longitud() {
		return get(pendientesEnvio).length;
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
	window.addEventListener('online', () => void sincronizarAhora());
	void refrescarOutbox();
	void sincronizarAhora();
}
