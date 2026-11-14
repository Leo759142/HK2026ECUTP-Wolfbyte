import { conSesion, enTx, param } from '#server/api.ts';
import { json, leerJson, sinContenido } from '#server/http.ts';
import * as fav from '#server/servicios/favores.ts';

export const GET = conSesion(async ({ db, s, event }) => json(await fav.detalle(db, s, param(event, 'favorId'))));

export const PATCH = conSesion(async ({ db, s, event }) => {
	const body = await leerJson(event.request);
	return json(await enTx(db, (tx) => fav.editar(tx, s, param(event, 'favorId'), body)));
});

export const DELETE = conSesion(async ({ db, s, event }) => {
	await enTx(db, (tx) => fav.eliminar(tx, s, param(event, 'favorId')));
	return sinContenido();
});
