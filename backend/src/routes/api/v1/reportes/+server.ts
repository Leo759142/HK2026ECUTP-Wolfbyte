import { conSesion, enTx } from '#server/api.ts';
import { json, leerJson } from '#server/http.ts';
import * as fav from '#server/servicios/favores.ts';

/** Reportar un servicio o favor. Con 3 reportes pendientes se oculta solo (trigger de la base). */
export const POST = conSesion(async ({ db, s, event }) => {
	const body = await leerJson(event.request);
	const r = await enTx(db, (tx) => fav.reportar(tx, s, body));
	return json({ ok: true, mensaje: 'Gracias. Un Guardián lo revisará.' }, r.creado ? 201 : 200);
});
