import { conSesion, enTx, param } from '#server/api.ts';
import { json } from '#server/http.ts';
import * as srv from '#server/servicios/servicios.ts';

/** Anota que le escribí por WhatsApp y devuelve el enlace con el mensaje listo (el número no se lista). */
export const POST = conSesion(async ({ db, s, event }) => {
	const esJson = event.request.headers.get('content-type')?.includes('json');
	const body = (esJson ? await event.request.json().catch(() => ({})) : {}) as { id?: unknown };
	return json(await enTx(db, (tx) => srv.contactar(tx, s, param(event, 'servicioId'), body.id)), 201);
});
