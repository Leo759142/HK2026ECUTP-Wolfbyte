import { conSesion, enTx, param } from '#server/api.ts';
import { json, leerJson } from '#server/http.ts';
import * as emer from '#server/servicios/emergencias.ts';

export const GET = conSesion(async ({ db, s, event }) => json(await emer.listarPedidos(db, s, param(event, 'emergenciaId'))));

export const POST = conSesion(async ({ db, s, event }) => {
	const body = await leerJson(event.request);
	const r = await enTx(db, (tx) => emer.pedirAyuda(tx, s, param(event, 'emergenciaId'), body));
	return json(r.pedido, r.creado ? 201 : 200);
});
