import { conSesion, enTx, param } from '#server/api.ts';
import { json, leerJson, sinContenido } from '#server/http.ts';
import * as srv from '#server/servicios/servicios.ts';

export const GET = conSesion(async ({ db, s, event }) => json(await srv.detalle(db, s, param(event, 'servicioId'))));

export const PATCH = conSesion(async ({ db, s, event }) => {
	const body = await leerJson(event.request);
	return json(await enTx(db, (tx) => srv.editar(tx, s, param(event, 'servicioId'), body)));
});

export const DELETE = conSesion(async ({ db, s, event }) => {
	await enTx(db, (tx) => srv.eliminar(tx, s, param(event, 'servicioId')));
	return sinContenido();
});
