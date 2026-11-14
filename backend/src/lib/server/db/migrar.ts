/**
 * Migraciones: aplica en orden los .sql de backend/migraciones que aún no estén en
 * schema_migraciones. Cada archivo corre en su propia transacción; si falla, no queda a medias.
 * Nunca borra datos: solo avanza.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { config } from '../config.ts';
import type { Db } from './index.ts';

export async function migrar(db: Db, dir = config().migracionesDir): Promise<string[]> {
	await db.exec(`CREATE TABLE IF NOT EXISTS schema_migraciones (
		nombre text PRIMARY KEY,
		aplicada_en timestamptz NOT NULL DEFAULT now()
	)`);
	const hechas = new Set((await db.query<{ nombre: string }>('SELECT nombre FROM schema_migraciones')).map((r) => r.nombre));
	const archivos = readdirSync(dir)
		.filter((f) => /^\d{3}_.+\.sql$/.test(f))
		.sort();
	const aplicadas: string[] = [];
	for (const archivo of archivos) {
		if (hechas.has(archivo)) continue;
		const sql = readFileSync(join(dir, archivo), 'utf8');
		try {
			await db.transaccion(async (tx) => {
				await tx.exec(sql);
				await tx.query('INSERT INTO schema_migraciones(nombre) VALUES ($1)', [archivo]);
			});
		} catch (e) {
			throw new Error(`Falló la migración ${archivo}: ${(e as Error).message}`);
		}
		aplicadas.push(archivo);
		console.info(`[AYNI] Migración aplicada: ${archivo}`);
	}
	return aplicadas;
}
