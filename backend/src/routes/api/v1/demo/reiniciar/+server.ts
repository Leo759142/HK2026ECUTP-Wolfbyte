import { conSesion } from '#server/api.ts';
import { sinContenido } from '#server/http.ts';
import { borrarCookie } from '#server/auth/sesion.ts';
import * as demo from '#server/servicios/demo.ts';

/** Demo: borra TODOS los datos y vuelve al sector de ejemplo (cierra todas las sesiones). Solo con AYNI_DEMO=true. */
export const POST = conSesion(async ({ db, event }) => {
	demo.exigirDemo();
	await demo.reiniciar(db);
	borrarCookie(event.cookies);
	return sinContenido();
});
