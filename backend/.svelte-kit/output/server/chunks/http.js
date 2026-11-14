import { t as config } from "./config2.js";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
// src/lib/server/db/migrar.ts
/**
* Migraciones: aplica en orden los .sql de backend/migraciones que aún no estén en
* schema_migraciones. Cada archivo corre en su propia transacción; si falla, no queda a medias.
* Nunca borra datos: solo avanza.
*/
async function migrar(db, dir = config().migracionesDir) {
	await db.exec(`CREATE TABLE IF NOT EXISTS schema_migraciones (
		nombre text PRIMARY KEY,
		aplicada_en timestamptz NOT NULL DEFAULT now()
	)`);
	const hechas = new Set((await db.query("SELECT nombre FROM schema_migraciones")).map((r) => r.nombre));
	const archivos = readdirSync(dir).filter((f) => /^\d{3}_.+\.sql$/.test(f)).sort();
	const aplicadas = [];
	for (const archivo of archivos) {
		if (hechas.has(archivo)) continue;
		const sql = readFileSync(join(dir, archivo), "utf8");
		try {
			await db.transaccion(async (tx) => {
				await tx.exec(sql);
				await tx.query("INSERT INTO schema_migraciones(nombre) VALUES ($1)", [archivo]);
			});
		} catch (e) {
			throw new Error(`Falló la migración ${archivo}: ${e.message}`);
		}
		aplicadas.push(archivo);
		console.info(`[AYNI] Migración aplicada: ${archivo}`);
	}
	return aplicadas;
}
// src/lib/server/db/index.ts
/**
* Acceso a PostgreSQL con el driver `pg` (pool de conexiones).
* La conexión sale de DATABASE_URL (backend/.env). Sin ella el backend no arranca.
*/
/** Las fechas viajan como ISO-8601 con zona (UTC). */
var normalizar = (params) => params.map((p) => p instanceof Date ? p.toISOString() : p);
async function crearPostgres(url) {
	const pg = await import("pg");
	const { Pool, types } = pg.default ?? pg;
	types.setTypeParser(20, (v) => Number.parseInt(v, 10));
	types.setTypeParser(1700, (v) => Number.parseFloat(v));
	const pool = new Pool({
		connectionString: url,
		max: Number(process.env.PG_POOL_MAX ?? 10)
	});
	return {
		descripcion: `PostgreSQL ${(() => {
			try {
				const u = new URL(url);
				return `${u.hostname}:${u.port || 5432}${u.pathname}`;
			} catch {
				return "servidor";
			}
		})()}`,
		async query(sql, params = []) {
			return (await pool.query(sql, normalizar(params))).rows;
		},
		async exec(sql) {
			await pool.query(sql);
		},
		async transaccion(fn) {
			const cliente = await pool.connect();
			try {
				await cliente.query("BEGIN");
				const r = await fn({
					query: async (s, p = []) => (await cliente.query(s, normalizar(p))).rows,
					exec: async (s) => void await cliente.query(s)
				});
				await cliente.query("COMMIT");
				return r;
			} catch (e) {
				await cliente.query("ROLLBACK").catch(() => void 0);
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
async function crearDb(op = {}) {
	const url = op.url === void 0 ? config().databaseUrl : op.url;
	if (!url) throw new Error("Falta DATABASE_URL. Copia backend/.env.example como backend/.env y escribe la conexión a PostgreSQL.");
	const db = await crearPostgres(url);
	if (op.migrar !== false) await migrar(db);
	return db;
}
var instancia = null;
/** Conexión compartida del servidor (se crea y migra la primera vez que se usa). */
function obtenerDb() {
	if (!instancia) instancia = (async () => {
		const db = await crearDb();
		console.info(`[AYNI] Base de datos: ${db.descripcion}`);
		const { asegurarDatosDemo } = await import("./seed-demo.js");
		await asegurarDatosDemo(db);
		return db;
	})().catch((e) => {
		instancia = null;
		throw e;
	});
	return instancia;
}
// src/lib/server/http.ts
var ErrorApi = class extends Error {
	status;
	codigo;
	constructor(status, codigo, mensaje) {
		super(mensaje);
		this.status = status;
		this.codigo = codigo;
	}
};
var err = {
	invalido: (mensaje, codigo = "DATOS_INVALIDOS") => new ErrorApi(422, codigo, mensaje),
	noAutorizado: (mensaje = "Inicia sesión para continuar.", codigo = "NO_AUTORIZADO") => new ErrorApi(401, codigo, mensaje),
	prohibido: (mensaje = "No tienes permiso para esto.", codigo = "PROHIBIDO") => new ErrorApi(403, codigo, mensaje),
	noEncontrado: (mensaje = "No existe o ya no está disponible.", codigo = "NO_ENCONTRADO") => new ErrorApi(404, codigo, mensaje),
	conflicto: (mensaje, codigo = "CONFLICTO") => new ErrorApi(409, codigo, mensaje),
	limite: (mensaje = "Demasiadas peticiones. Espera un momento e inténtalo otra vez.") => new ErrorApi(429, "LIMITE_EXCEDIDO", mensaje),
	noDisponible: (mensaje, codigo = "NO_DISPONIBLE") => new ErrorApi(503, codigo, mensaje)
};
var CABECERAS = {
	"content-type": "application/json; charset=utf-8",
	"cache-control": "no-store"
};
function json(data, status = 200, headers = {}) {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			...CABECERAS,
			...headers
		}
	});
}
function sinContenido(headers = {}) {
	return new Response(null, {
		status: 204,
		headers: {
			"cache-control": "no-store",
			...headers
		}
	});
}
function respuestaError(e) {
	return json({
		codigo: e.codigo,
		mensaje: e.message
	}, e.status);
}
/**
* Traduce errores de PostgreSQL a errores de la API.
* Los triggers del esquema lanzan RAISE EXCEPTION con textos ya pensados para el vecino.
*/
function traducirErrorDb(e) {
	const x = e;
	if (!x || typeof x.code !== "string") return null;
	const msg = x.message ?? "";
	switch (x.code) {
		case "23505": return err.conflicto("Eso ya existe.", "YA_EXISTE");
		case "23503": return err.invalido("Hace referencia a algo que no existe.", "REFERENCIA_INVALIDA");
		case "23514":
		case "23502":
		case "22P02":
		case "22001": return err.invalido("Algún dato no es válido. Revisa e inténtalo otra vez.");
		case "P0001":
			if (/Guardián/i.test(msg)) return err.prohibido(msg, "SOLO_GUARDIAN");
			if (/propio servicio|atendidos/i.test(msg)) return err.prohibido(msg, "NO_PUEDE_RECOMENDAR");
			if (/append-only/i.test(msg)) return err.conflicto("Esto no se puede modificar.", "SOLO_AGREGAR");
			return err.invalido(msg);
		default: return null;
	}
}
function aErrorApi(e) {
	if (e instanceof ErrorApi) return e;
	const db = traducirErrorDb(e);
	if (db) return db;
	console.error("[AYNI] Error no controlado:", e);
	return new ErrorApi(500, "ERROR_INTERNO", "Algo salió mal en el servidor. Inténtalo otra vez en un momento.");
}
/** Envuelve un handler para devolver siempre { codigo, mensaje } ante errores. */
function ruta(fn) {
	return async (event) => {
		try {
			return await fn(event);
		} catch (e) {
			return respuestaError(aErrorApi(e));
		}
	};
}
async function leerJson(request) {
	if (!(request.headers.get("content-type") ?? "").includes("application/json")) throw err.invalido("Envía los datos en formato JSON (content-type: application/json).", "JSON_REQUERIDO");
	const body = await request.json().catch(() => void 0);
	if (!body || typeof body !== "object" || Array.isArray(body)) throw err.invalido("El cuerpo debe ser un objeto JSON.", "JSON_INVALIDO");
	return body;
}
export { ruta as a, leerJson as i, err as n, sinContenido as o, json as r, obtenerDb as s, aErrorApi as t };

//# sourceMappingURL=http.js.map