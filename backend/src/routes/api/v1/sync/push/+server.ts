import { conSesion } from '#server/api.ts';
import { json, leerJson } from '#server/http.ts';
import { tokenDeRequest } from '#server/auth/sesion.ts';
import * as sync from '#server/servicios/sync.ts';

/** Lote de operaciones hechas sin conexión. Idempotente por op_id. */
export const POST = conSesion(async ({ db, s, event }) => {
	const body = await leerJson(event.request);
	return json(await sync.push(db, s, tokenDeRequest(event.request, event.cookies) ?? '', body));
});
