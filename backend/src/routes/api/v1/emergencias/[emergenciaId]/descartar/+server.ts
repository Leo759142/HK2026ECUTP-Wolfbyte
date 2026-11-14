import { conSesion, enTx, param } from '#server/api.ts';
import { json, leerJson } from '#server/http.ts';
import * as emer from '#server/servicios/emergencias.ts';

export const POST = conSesion(async ({ db, s, event }) => {
	const body = await leerJson(event.request);
	return json(await enTx(db, (tx) => emer.descartar(tx, s, param(event, 'emergenciaId'), body)));
});
