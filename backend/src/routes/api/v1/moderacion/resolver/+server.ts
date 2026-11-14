import { conSesion, enTx } from '#server/api.ts';
import { json, leerJson } from '#server/http.ts';
import * as fav from '#server/servicios/favores.ts';

export const POST = conSesion(async ({ db, s, event }) => {
	const body = await leerJson(event.request);
	await enTx(db, (tx) => fav.resolver(tx, s, body));
	return json({ ok: true });
});
