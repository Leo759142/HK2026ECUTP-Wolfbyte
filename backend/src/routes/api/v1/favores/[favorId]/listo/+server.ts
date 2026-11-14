import { conSesion, enTx, param } from '#server/api.ts';
import { json } from '#server/http.ts';
import * as fav from '#server/servicios/favores.ts';

/** Botón "Listo": cuando ambos lo pulsan el favor se cierra y suma al Balance de Ayni. */
export const POST = conSesion(async ({ db, s, event }) => json(await enTx(db, (tx) => fav.listo(tx, s, param(event, 'favorId')))));
