/**
 * Respuestas y errores de la API. Contrato: errores siempre { codigo, mensaje }
 * con un texto simple que el frontend puede mostrar al vecino.
 */
import type { RequestEvent } from '@sveltejs/kit';

export class ErrorApi extends Error {
	readonly status: number;
	readonly codigo: string;
	constructor(status: number, codigo: string, mensaje: string) {
		super(mensaje);
		this.status = status;
		this.codigo = codigo;
	}
}

export const err = {
	invalido: (mensaje: string, codigo = 'DATOS_INVALIDOS') => new ErrorApi(422, codigo, mensaje),
	noAutorizado: (mensaje = 'Inicia sesión para continuar.', codigo = 'NO_AUTORIZADO') => new ErrorApi(401, codigo, mensaje),
	prohibido: (mensaje = 'No tienes permiso para esto.', codigo = 'PROHIBIDO') => new ErrorApi(403, codigo, mensaje),
	noEncontrado: (mensaje = 'No existe o ya no está disponible.', codigo = 'NO_ENCONTRADO') => new ErrorApi(404, codigo, mensaje),
	conflicto: (mensaje: string, codigo = 'CONFLICTO') => new ErrorApi(409, codigo, mensaje),
	limite: (mensaje = 'Demasiadas peticiones. Espera un momento e inténtalo otra vez.') => new ErrorApi(429, 'LIMITE_EXCEDIDO', mensaje),
	noDisponible: (mensaje: string, codigo = 'NO_DISPONIBLE') => new ErrorApi(503, codigo, mensaje)
};

const CABECERAS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
	return new Response(JSON.stringify(data), { status, headers: { ...CABECERAS, ...headers } });
}

export function sinContenido(headers: Record<string, string> = {}): Response {
	return new Response(null, { status: 204, headers: { 'cache-control': 'no-store', ...headers } });
}

export function respuestaError(e: ErrorApi): Response {
	return json({ codigo: e.codigo, mensaje: e.message }, e.status);
}

/**
 * Traduce errores de PostgreSQL a errores de la API.
 * Los triggers del esquema lanzan RAISE EXCEPTION con textos ya pensados para el vecino.
 */
export function traducirErrorDb(e: unknown): ErrorApi | null {
	const x = e as { code?: string; message?: string; constraint?: string };
	if (!x || typeof x.code !== 'string') return null;
	const msg = x.message ?? '';
	switch (x.code) {
		case '23505':
			return err.conflicto('Eso ya existe.', 'YA_EXISTE');
		case '23503':
			return err.invalido('Hace referencia a algo que no existe.', 'REFERENCIA_INVALIDA');
		case '23514':
		case '23502':
		case '22P02':
		case '22001':
			return err.invalido('Algún dato no es válido. Revisa e inténtalo otra vez.');
		case 'P0001':
			if (/Guardián/i.test(msg)) return err.prohibido(msg, 'SOLO_GUARDIAN');
			if (/propio servicio|atendidos/i.test(msg)) return err.prohibido(msg, 'NO_PUEDE_RECOMENDAR');
			if (/append-only/i.test(msg)) return err.conflicto('Esto no se puede modificar.', 'SOLO_AGREGAR');
			return err.invalido(msg);
		default:
			return null;
	}
}

export function aErrorApi(e: unknown): ErrorApi {
	if (e instanceof ErrorApi) return e;
	const db = traducirErrorDb(e);
	if (db) return db;
	console.error('[AYNI] Error no controlado:', e);
	return new ErrorApi(500, 'ERROR_INTERNO', 'Algo salió mal en el servidor. Inténtalo otra vez en un momento.');
}

/** Envuelve un handler para devolver siempre { codigo, mensaje } ante errores. */
export function ruta<E extends RequestEvent>(fn: (event: E) => Promise<Response>) {
	return async (event: E): Promise<Response> => {
		try {
			return await fn(event);
		} catch (e) {
			return respuestaError(aErrorApi(e));
		}
	};
}

export async function leerJson(request: Request): Promise<Record<string, unknown>> {
	const tipo = request.headers.get('content-type') ?? '';
	if (!tipo.includes('application/json')) {
		throw err.invalido('Envía los datos en formato JSON (content-type: application/json).', 'JSON_REQUERIDO');
	}
	const body = await request.json().catch(() => undefined);
	if (!body || typeof body !== 'object' || Array.isArray(body)) {
		throw err.invalido('El cuerpo debe ser un objeto JSON.', 'JSON_INVALIDO');
	}
	return body as Record<string, unknown>;
}
