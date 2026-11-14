/** Ayudas comunes para los endpoints (+server.ts). */
import type { RequestEvent } from '@sveltejs/kit';
import { obtenerDb, type Consulta, type Db } from './db/index.ts';
import { err, ruta } from './http.ts';
import type { SesionActual } from './auth/sesion.ts';

export interface Contexto {
	db: Db;
	s: SesionActual;
	event: RequestEvent;
}

/** La base de datos; si no está configurada o no responde, 503 con un mensaje claro. */
async function base(): Promise<Db> {
	try {
		return await obtenerDb();
	} catch (e) {
		console.error('[AYNI] Base de datos no disponible:', (e as Error).message);
		throw err.noDisponible('El servidor no puede conectarse a la base de datos. Revisa DATABASE_URL en backend/.env.', 'BASE_NO_DISPONIBLE');
	}
}

/** Endpoint que necesita sesión iniciada. */
export function conSesion(fn: (c: Contexto) => Promise<Response>) {
	return ruta(async (event: RequestEvent) => {
		const s = event.locals.sesion;
		if (!s) throw err.noAutorizado();
		return fn({ db: await base(), s, event });
	});
}

/** Endpoint público (sin sesión). */
export function publico(fn: (c: { db: Db; event: RequestEvent }) => Promise<Response>) {
	return ruta(async (event: RequestEvent) => fn({ db: await base(), event }));
}

/** Ejecuta una escritura en una transacción (todo o nada). */
export const enTx = <T>(db: Db, fn: (tx: Consulta) => Promise<T>) => db.transaccion(fn);

export const param = (event: RequestEvent, nombre: string): string => event.params[nombre as keyof typeof event.params] as string;

export function bool(valor: string | null): boolean {
	return valor === 'true' || valor === '1';
}
