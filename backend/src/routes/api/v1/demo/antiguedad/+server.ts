import { conSesion } from '#server/api.ts';
import { leerJson, sinContenido } from '#server/http.ts';
import * as demo from '#server/servicios/demo.ts';

/** Demo: "Simular 2 meses en AYNI". Solo con AYNI_DEMO=true. */
export const POST = conSesion(async ({ db, s, event }) => {
	demo.exigirDemo();
	await demo.simularAntiguedad(db, s, await leerJson(event.request));
	return sinContenido();
});
