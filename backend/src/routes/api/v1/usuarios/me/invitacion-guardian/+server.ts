import { conSesion, enTx } from '#server/api.ts';
import { json, leerJson } from '#server/http.ts';
import * as cuentas from '#server/servicios/cuentas.ts';

export const POST = conSesion(async ({ db, s, event }) => {
	const body = await leerJson(event.request);
	return json(await enTx(db, (tx) => cuentas.responderInvitacion(tx, s, body)));
});
