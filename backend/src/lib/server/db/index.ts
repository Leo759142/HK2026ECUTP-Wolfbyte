/**
 * Acceso a PostgreSQL con el driver `pg` (pool de conexiones).
 * La conexión sale de DATABASE_URL (backend/.env). Sin ella el backend no arranca.
 */
import { config } from '../config.ts';
import { migrar } from './migrar.ts';

export type Fila = Record<string, unknown>;

export interface Consulta {
	query<T = Fila>(sql: string, params?: unknown[]): Promise<T[]>;
	/** Varias sentencias SQL sin parámetros (migraciones). */
	exec(sql: string): Promise<void>;
}

export interface Db extends Consulta {
	readonly descripcion: string;
	transaccion<T>(fn: (tx: Consulta) => Promise<T>): Promise<T>;
	cerrar(): Promise<void>;
}

/** Las fechas viajan como ISO-8601 con zona (UTC). */
const normalizar = (params: unknown[]) => params.map((p) => (p instanceof Date ? p.toISOString() : p));

async function crearPostgres(url: string): Promise<Db> {
	const pg = await import('pg');
	const { Pool, types } = pg.default ?? pg;
	types.setTypeParser(20, (v: string) => Number.parseInt(v, 10)); // int8 (count)
	types.setTypeParser(1700, (v: string) => Number.parseFloat(v)); // numeric (lat/lng)
	const pool = new Pool({ connectionString: url, max: Number(process.env.PG_POOL_MAX ?? 10) });
	const host = (() => {
		try {
			const u = new URL(url);
			return `${u.hostname}:${u.port || 5432}${u.pathname}`;
		} catch {
			return 'servidor';
		}
	})();
	return {
		descripcion: `PostgreSQL ${host}`,
		async query<T>(sql: string, params: unknown[] = []) {
			return (await pool.query(sql, normalizar(params))).rows as T[];
		},
		async exec(sql: string) {
			await pool.query(sql);
		},
		async transaccion<T>(fn: (tx: Consulta) => Promise<T>) {
			const cliente = await pool.connect();
			try {
				await cliente.query('BEGIN');
				const r = await fn({
					query: async <F>(s: string, p: unknown[] = []) => (await cliente.query(s, normalizar(p))).rows as F[],
					exec: async (s: string) => void (await cliente.query(s))
				});
				await cliente.query('COMMIT');
				return r;
			} catch (e) {
				await cliente.query('ROLLBACK').catch(() => undefined);
				throw e;
			} finally {
				cliente.release();
			}
		},
		async cerrar() {
			await pool.end();
		}
	};
}

export interface OpcionesDb {
	url?: string | null;
	migrar?: boolean;
}

export async function crearDb(op: OpcionesDb = {}): Promise<Db> {
	const url = op.url === undefined ? config().databaseUrl : op.url;
	if (!url) {
		throw new Error('Falta DATABASE_URL. Copia backend/.env.example como backend/.env y escribe la conexión a PostgreSQL.');
	}
	const db = await crearPostgres(url);
	if (op.migrar !== false) await migrar(db);
	return db;
}

let instancia: Promise<Db> | null = null;

/** Conexión compartida del servidor (se crea y migra la primera vez que se usa). */
export function obtenerDb(): Promise<Db> {
	if (!instancia) {
		instancia = (async () => {
			const db = await crearDb();
			console.info(`[AYNI] Base de datos: ${db.descripcion}`);
			const { asegurarDatosDemo } = await import('./seed-demo.ts');
			await asegurarDatosDemo(db);
			return db;
		})().catch((e) => {
			instancia = null;
			throw e;
		});
	}
	return instancia;
}

/** Solo para tests: usa esta base en lugar de la del servidor. */
export function usarDbParaTests(db: Db): void {
	instancia = Promise.resolve(db);
}
