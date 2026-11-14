import { conSesion, enTx, param } from '#server/api.ts';
import { json } from '#server/http.ts';
import * as emer from '#server/servicios/emergencias.ts';

/** "Voy yo": gana el primero. */
export const POST = conSesion(async ({ db, s, event }) => json(await enTx(db, (tx) => emer.ayudar(tx, s, param(event, 'pedidoId')))));
