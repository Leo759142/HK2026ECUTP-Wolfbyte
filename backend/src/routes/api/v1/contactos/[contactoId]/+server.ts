import { conSesion, enTx, param } from '#server/api.ts';
import { json, leerJson } from '#server/http.ts';
import * as srv from '#server/servicios/servicios.ts';

export const PATCH = conSesion(async ({ db, s, event }) => {
	const body = await leerJson(event.request);
	return json(await enTx(db, (tx) => srv.responderContacto(tx, s, param(event, 'contactoId'), body)));
});
