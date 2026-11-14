import { conSesion, enTx, param } from '#server/api.ts';
import { leerJson, sinContenido } from '#server/http.ts';
import * as emer from '#server/servicios/emergencias.ts';

export const PUT = conSesion(async ({ db, s, event }) => {
	const body = await leerJson(event.request);
	await enTx(db, (tx) => emer.acusar(tx, s, param(event, 'emergenciaId'), body));
	return sinContenido();
});
