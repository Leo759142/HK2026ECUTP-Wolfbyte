import { conSesion, enTx, param } from '#server/api.ts';
import { sinContenido } from '#server/http.ts';
import * as demo from '#server/servicios/demo.ts';

/** Demo: simular que la otra persona también pulsó "Listo". Solo con AYNI_DEMO=true. */
export const POST = conSesion(async ({ db, s, event }) => {
	demo.exigirDemo();
	await enTx(db, (tx) => demo.confirmarOtroLado(tx, s, param(event, 'favorId')));
	return sinContenido();
});
