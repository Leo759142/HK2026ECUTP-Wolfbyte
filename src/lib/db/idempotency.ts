/**
 * Contrato de idempotencia para Postgres.
 * Tabla: idempotency_keys (op_id UNIQUE, resultado JSON, creado_en).
 * Cuando se disponga de conexión Postgres viva, se implementa el adaptador
 * reemplazando el Map en memoria de `src/rutas/api/v1/sync/+server.ts`.
 */

export const IDEMPOTENCY_KEYS_SQL = `
CREATE TABLE IF NOT EXISTS idempotency_keys (
    op_id VARCHAR(255) PRIMARY KEY,
    entidad VARCHAR(100) NOT NULL,
    operacion VARCHAR(50) NOT NULL,
    resultado JSONB NOT NULL,
    status_code INTEGER NOT NULL DEFAULT 200,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_entidad ON idempotency_keys(entidad);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_creado_en ON idempotency_keys(creado_en);
`;

export interface IdempotencyRecord {
	op_id: string;
	entidad: string;
	operacion: string;
	resultado: unknown;
	status_code: number;
	creado_en: string;
}

export interface IdempotencyStore {
	obtener(opId: string): Promise<IdempotencyRecord | null>;
	guardar(
		opId: string,
		entidad: string,
		operacion: string,
		resultado: unknown,
		statusCode: number
	): Promise<void>;
	existe(opId: string): Promise<boolean>;
}

/** Implementación stub (en memoria) que se reemplaza por Postgres cuando exista conexión. */
export class IdempotencyStoreMemoria implements IdempotencyStore {
	private store = new Map<string, IdempotencyRecord>();

	async obtener(opId: string): Promise<IdempotencyRecord | null> {
		return this.store.get(opId) ?? null;
	}

	async guardar(
		opId: string,
		entidad: string,
		operacion: string,
		resultado: unknown,
		statusCode: number
	): Promise<void> {
		this.store.set(opId, {
			op_id: opId,
			entidad,
			operacion,
			resultado,
			status_code: statusCode,
			creado_en: new Date().toISOString()
		});
	}

	async existe(opId: string): Promise<boolean> {
		return this.store.has(opId);
	}
}

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const ARCHIVO = resolve(process.cwd(), 'data', 'idempotency.json');

export class IdempotencyStoreArchivo implements IdempotencyStore {
	private cache: Map<string, IdempotencyRecord> | null = null;
	private load(): Map<string, IdempotencyRecord> {
		if (this.cache) return this.cache;
		this.cache = new Map();
		try {
			if (existsSync(ARCHIVO)) {
				const raw = JSON.parse(readFileSync(ARCHIVO, 'utf8')) as IdempotencyRecord[];
				for (const r of raw) this.cache.set(r.op_id, r);
			}
		} catch {
			this.cache = new Map();
		}
		return this.cache;
	}
	private persist() {
		try {
			mkdirSync(dirname(ARCHIVO), { recursive: true });
			writeFileSync(ARCHIVO, JSON.stringify([...this.load().values()], null, 2));
		} catch {
			/* ignore */
		}
	}
	async obtener(opId: string) {
		return this.load().get(opId) ?? null;
	}
	async guardar(
		opId: string,
		entidad: string,
		operacion: string,
		resultado: unknown,
		statusCode: number
	) {
		this.load().set(opId, {
			op_id: opId,
			entidad,
			operacion,
			resultado,
			status_code: statusCode,
			creado_en: new Date().toISOString()
		});
		this.persist();
	}
	async existe(opId: string) {
		return this.load().has(opId);
	}
}

const usarArchivo = process.env.IDEMPOTENCY_STORE === 'file';
export const idempotencyStore = usarArchivo
	? new IdempotencyStoreArchivo()
	: new IdempotencyStoreMemoria();
