import { conSesion, enTx } from '#server/api.ts';
import { leerJson, sinContenido } from '#server/http.ts';
import * as demo from '#server/servicios/demo.ts';

/** Demo: "Ver AYNI como Guardián". Solo con AYNI_DEMO=true. */
export const POST = conSesion(async ({ db, s, event }) => {
	demo.exigirDemo();
	const body = await leerJson(event.request);
	await enTx(db, (tx) => demo.comoGuardian(tx, s, body));
	return sinContenido();
});
