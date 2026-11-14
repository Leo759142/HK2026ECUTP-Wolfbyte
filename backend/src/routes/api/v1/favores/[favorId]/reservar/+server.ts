import { conSesion, enTx, param } from '#server/api.ts';
import { json } from '#server/http.ts';
import * as fav from '#server/servicios/favores.ts';

/** "Lo quiero / Puedo ayudar": reserva por 1 hora, gana el primero. Devuelve el enlace de WhatsApp con el dueño. */
export const POST = conSesion(async ({ db, s, event }) => json(await enTx(db, (tx) => fav.reservar(tx, s, param(event, 'favorId')))));
