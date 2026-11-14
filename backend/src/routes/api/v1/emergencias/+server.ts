import { conSesion, enTx } from '#server/api.ts';
import { json, leerJson } from '#server/http.ts';
import { listarEmergencias } from '#server/repositorios/emergencias.ts';
import * as emer from '#server/servicios/emergencias.ts';
import { opcion } from '#server/validar.ts';

/** El Guardián ve también las pendientes; el vecino, las activas/atendidas y las que reportó. */
export const GET = conSesion(async ({ db, s, event }) => {
	const e = event.url.searchParams.get('estado');
	const estado = e ? opcion(e, 'estado', ['pendiente', 'activa', 'descartada', 'atendida'] as const) : null;
	return json(await listarEmergencias(db, emer.lector(s), { estado }));
});

export const POST = conSesion(async ({ db, s, event }) => {
	const body = await leerJson(event.request);
	const r = await enTx(db, (tx) => emer.reportar(tx, s, body));
	return json(r.emergencia, r.creada ? 201 : 200);
});
