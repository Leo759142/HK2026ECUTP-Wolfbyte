import type { EstadoSyncCola, OperacionSync } from '../dominio/tipos/tipos';
import { obtenerAlmacenKV, type AlmacenKV } from './almacen';

export type EstadoOutbox = EstadoSyncCola | 'conflicto';

export interface OperacionOutbox {
	op_id: string;
	entidad: string;
	operacion: OperacionSync;
	payload: unknown;
	estado: EstadoOutbox;
	intentos: number;
	creado_en: string;
	actualizado_en: string;
	next_attempt_at?: number;
	error?: string | null;
	idempotency_key?: string;
}

const PREFIX = 'outbox:';
const LEGACY_V2 = 'comunidad_sync_cola_v2';
const LEGACY_V1 = 'comunidad_outbox_v1';

function key(id: string) {
	return `${PREFIX}${id}`;
}

export class OutboxDAO {
	constructor(private kv: AlmacenKV = obtenerAlmacenKV()) {}

	async migrarLegacy(): Promise<void> {
		if (typeof localStorage === 'undefined') return;
		try {
			const raw = localStorage.getItem(LEGACY_V2);
			if (raw) {
				const arr = JSON.parse(raw) as Array<Record<string, unknown>>;
				for (const p of arr) {
					const id = String(p.id ?? p.op_id ?? crypto.randomUUID());
					const exists = await this.kv.get(key(id));
					if (exists) continue;
					await this.kv.set(key(id), {
						op_id: id,
						entidad: String(p.entidad ?? p.accion ?? 'desconocido'),
						operacion: (p.operacion as OperacionSync) ?? 'crear',
						payload: typeof p.payload === 'string' ? safeParse(p.payload) : p.payload,
						estado: p.estadoOffline === 'Enviada' ? 'aplicada' : 'pendiente',
						intentos: Number(p.intentos ?? 0),
						creado_en: new Date(Number(p.creadoEn ?? Date.now())).toISOString(),
						actualizado_en: new Date().toISOString(),
						error: (p.error as string) ?? null,
						idempotency_key: id
					} satisfies OperacionOutbox);
				}
				localStorage.removeItem(LEGACY_V2);
			}
			const raw1 = localStorage.getItem(LEGACY_V1);
			if (raw1) localStorage.removeItem(LEGACY_V1);
		} catch {
			/* migración best-effort */
		}
	}

	async encolar(op: {
		op_id: string;
		entidad: string;
		operacion: OperacionSync;
		payload: unknown;
	}): Promise<OperacionOutbox> {
		await this.migrarLegacy();
		const now = new Date().toISOString();
		const item: OperacionOutbox = {
			op_id: op.op_id,
			entidad: op.entidad,
			operacion: op.operacion,
			payload: op.payload,
			estado: 'pendiente',
			intentos: 0,
			creado_en: now,
			actualizado_en: now,
			error: null,
			idempotency_key: op.op_id
		};
		await this.kv.set(key(op.op_id), item);
		return item;
	}

	/** Todas las operaciones guardadas (las aplicadas se borran), en orden de creación. Para mostrar en la UI. */
	async listarTodas(): Promise<OperacionOutbox[]> {
		await this.migrarLegacy();
		const keys = await this.kv.keys(PREFIX);
		const items = (await Promise.all(keys.map((k) => this.kv.get<OperacionOutbox>(k)))).filter(
			Boolean
		) as OperacionOutbox[];
		return items.sort((a, b) => a.creado_en.localeCompare(b.creado_en));
	}

	/** Operaciones listas para enviar ahora (sin reintento programado a futuro). Las usa el motor de sync. */
	async pendientes(ahora = Date.now()): Promise<OperacionOutbox[]> {
		return (await this.listarTodas())
			.filter((p) => esPendiente(p.estado))
			.filter((p) => !p.next_attempt_at || p.next_attempt_at <= ahora);
	}

	/** Momento (ms epoch) del próximo reintento programado, o null si no hay ninguno. */
	async proximoReintento(): Promise<number | null> {
		const tiempos = (await this.listarTodas())
			.filter((p) => esPendiente(p.estado) && p.next_attempt_at)
			.map((p) => p.next_attempt_at as number);
		return tiempos.length ? Math.min(...tiempos) : null;
	}

	/** Borra una operación (p. ej. una rechazada que el usuario decide descartar). */
	async descartar(op_id: string): Promise<void> {
		await this.kv.del(key(op_id));
	}

	async pendientesPaginado(
		opts: { limite?: number; offset?: number } = {}
	): Promise<{ items: OperacionOutbox[]; total: number }> {
		await this.migrarLegacy();
		const keys = await this.kv.keys(PREFIX);
		const all = (await Promise.all(keys.map((k) => this.kv.get<OperacionOutbox>(k)))).filter(
			Boolean
		) as OperacionOutbox[];
		const filtered = all
			.filter((p) => p.estado === 'pendiente' || p.estado === 'enviando')
			.filter((p) => !p.next_attempt_at || p.next_attempt_at <= Date.now())
			.sort((a, b) => a.creado_en.localeCompare(b.creado_en));
		const total = filtered.length;
		const offset = opts.offset ?? 0;
		const limite = opts.limite ?? total;
		const page = filtered.slice(offset, offset + limite);
		return { items: page, total };
	}

	async marcar(op_id: string, estado: EstadoOutbox, error?: string | null): Promise<void> {
		const cur = await this.kv.get<OperacionOutbox>(key(op_id));
		if (!cur) return;
		const next: OperacionOutbox = {
			...cur,
			estado,
			error: error ?? cur.error ?? null,
			actualizado_en: new Date().toISOString(),
			// Un intento = un envío. Se cuenta solo al pasar a "enviando".
			intentos: estado === 'enviando' ? cur.intentos + 1 : cur.intentos
		};
		if (estado === 'aplicada') await this.kv.del(key(op_id));
		else await this.kv.set(key(op_id), next);
	}

	async programarReintento(op_id: string, ms: number, error?: string): Promise<void> {
		const cur = await this.kv.get<OperacionOutbox>(key(op_id));
		if (!cur) return;
		await this.kv.set(key(op_id), {
			...cur,
			estado: 'pendiente',
			next_attempt_at: Date.now() + ms,
			error: error ?? cur.error ?? null,
			actualizado_en: new Date().toISOString()
		});
	}
}

/** Pendiente de enviar (incluye las que quedaron "enviando" si se cerró la app a mitad). */
export function esPendiente(estado: EstadoOutbox): boolean {
	return estado === 'pendiente' || estado === 'enviando';
}

/** Rechazada por el servidor o en conflicto: necesita que alguien la revise. */
export function requiereAtencion(estado: EstadoOutbox): boolean {
	return estado === 'rechazada' || estado === 'conflicto';
}

function safeParse(s: string): unknown {
	try {
		return JSON.parse(s);
	} catch {
		return s;
	}
}

export const outboxDAO = new OutboxDAO();
