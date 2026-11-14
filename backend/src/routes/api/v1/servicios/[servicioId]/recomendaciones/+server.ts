import { conSesion, enTx, param } from '#server/api.ts';
import { json, leerJson } from '#server/http.ts';
import { recomendacionesDeServicio } from '#server/repositorios/servicios.ts';
import * as srv from '#server/servicios/servicios.ts';

export const GET = conSesion(async ({ db, s, event }) => {
	const sv = await srv.detalle(db, s, param(event, 'servicioId'));
	return json(await recomendacionesDeServicio(db, sv.id));
});

export const POST = conSesion(async ({ db, s, event }) => {
	const body = await leerJson(event.request);
	const r = await enTx(db, (tx) => srv.recomendar(tx, s, param(event, 'servicioId'), body));
	return json(r.reco, r.creada ? 201 : 200);
});
