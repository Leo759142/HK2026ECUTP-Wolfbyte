import { conSesion, enTx, param } from '#server/api.ts';
import { json } from '#server/http.ts';
import * as fav from '#server/servicios/favores.ts';

export const POST = conSesion(async ({ db, s, event }) => json(await enTx(db, (tx) => fav.liberar(tx, s, param(event, 'favorId')))));
