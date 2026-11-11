import type { OperacionSync } from '../dominio/tipos/tipos';
import { obtenerAlmacenKV } from './almacen';
import { outboxDAO, type OperacionOutbox } from './outbox';

export type { OperacionOutbox };

/**
 * DAO local unificado (RF17/RF18 base): acceso a almacenamiento KV + outbox.
 * - No contiene reglas de negocio (esas van en dominio/repositorios/casos de uso).
 * - Persistencia: IndexedDB en navegador, fallback memoria (SSR/tests).
 * - Outbox: operaciones idempotentes por op_id; migración best-effort desde localStorage legacy.
 * TODO(robustez): SQLite WASM+OPFS vía Web Worker + transacciones reales por store.
 */
export class DaoLocal {
	private kv = obtenerAlmacenKV();

	async transaccion<T>(fn: () => Promise<T>): Promise<T> {
		return fn();
	}

	// ---- CRUD local genérico (base para repositorios). Entidades alineadas a schema_sqlite.sql ----
	async aplicarLocal(entidad: string, payload: Record<string, unknown>): Promise<void> {
		const id = String(payload.id ?? payload.op_id ?? crypto.randomUUID());
		await this.kv.set(`entity:${entidad}:${id}`, {
			...payload,
			_entidad: entidad,
			_actualizado_local: new Date().toISOString()
		});
	}

	async obtenerLocal<T = Record<string, unknown>>(entidad: string, id: string): Promise<T | null> {
		return this.kv.get<T>(`entity:${entidad}:${id}`);
	}

	async listarLocal<T = Record<string, unknown>>(entidad: string): Promise<T[]> {
		const keys = await this.kv.keys(`entity:${entidad}:`);
		const rows = await Promise.all(keys.map((k) => this.kv.get<T>(k)));
		return rows.filter(Boolean) as T[];
	}

	async contarLocal(entidad: string): Promise<number> {
		const keys = await this.kv.keys(`entity:${entidad}:`);
		return keys.length;
	}

	async listarLocalPaginado<T = Record<string, unknown>>(
		entidad: string,
		opts: { limite?: number; offset?: number } = {}
	): Promise<{ items: T[]; total: number }> {
		const keys = await this.kv.keys(`entity:${entidad}:`);
		const total = keys.length;
		const offset = opts?.offset ?? 0;
		const limite = opts?.limite ?? total;
		const pageKeys = keys.slice(offset, offset + limite);
		const rows = await Promise.all(pageKeys.map((k) => this.kv.get<T>(k)));
		return { items: rows.filter(Boolean) as T[], total };
	}

	async eliminarLocal(entidad: string, id: string): Promise<void> {
		await this.kv.del(`entity:${entidad}:${id}`);
	}

	// ---- Outbox (sync_cola / cola offline) ----
	async encolar(op: {
		op_id: string;
		entidad: string;
		operacion: OperacionSync;
		payload: unknown;
	}): Promise<void> {
		await outboxDAO.encolar(op);
	}

	async pendientes(): Promise<
		Array<{
			id: string;
			entidad?: string;
			operacion?: OperacionSync;
			payload: unknown;
			intentos?: number;
		}>
	> {
		const items = await outboxDAO.pendientes();
		return items.map((p) => ({
			id: p.op_id,
			entidad: p.entidad,
			operacion: p.operacion,
			payload: p.payload,
			intentos: p.intentos
		}));
	}

	async marcar(op_id: string, estado: 'aplicada' | 'rechazada', error?: string): Promise<void> {
		await outboxDAO.marcar(op_id, estado, error ?? null);
	}

	// ---- Información y estadísticas de la base de datos local ----

	/** Lista todas las entidades que existen en la base de datos con sus conteos. */
	async listarEntidadesConConteo(): Promise<Array<{ entidad: string; total: number; ultimo_actualizado?: string }>> {
		const todasLasClaves = await this.kv.keys('entity:');
		const porEntidad = new Map<string, { total: number; ultima?: string }>();

		for (const clave of todasLasClaves) {
			const partes = clave.split(':');
			if (partes.length < 3) continue;
			const entidad = partes[1];

			const actual = porEntidad.get(entidad) ?? { total: 0 };
			actual.total += 1;

			const fila = await this.kv.get<Record<string, unknown>>(clave);
			const ts = fila?._actualizado_local ?? fila?.updated_at ?? fila?.created_at;
			if (ts && (!actual.ultima || String(ts) > actual.ultima)) {
				actual.ultima = String(ts);
			}

			porEntidad.set(entidad, actual);
		}

		return Array.from(porEntidad.entries()).map(([entidad, info]) => ({
			entidad,
			total: info.total,
			ultimo_actualizado: info.ultima
		})).sort((a, b) => a.entidad.localeCompare(b.entidad));
	}

	/** Información detallada del almacén KV (backend usado, tamaño aproximado). */
	async infoAlmacen(): Promise<{
		backend: string;
		total_claves: number;
		claves_por_prefijo: Record<string, number>;
	}> {
		const todas = await this.kv.keys('');
		const porPrefijo = new Map<string, number>();

		for (const clave of todas) {
			const prefijo = clave.split(':')[0] ?? 'otro';
			porPrefijo.set(prefijo, (porPrefijo.get(prefijo) ?? 0) + 1);
		}

		const nombreClase = this.kv.constructor.name;
		let backend = 'memoria';
		if (nombreClase.includes('IndexedDb')) backend = 'indexeddb';
		else if (nombreClase.includes('LocalStorage')) backend = 'localstorage';
		else if (nombreClase.includes('Memoria')) backend = 'memoria';

		return {
			backend,
			total_claves: todas.length,
			claves_por_prefijo: Object.fromEntries(porPrefijo)
		};
	}
}

export const dao = new DaoLocal();
export { outboxDAO };
