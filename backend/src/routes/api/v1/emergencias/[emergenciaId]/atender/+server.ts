import { conSesion, enTx, param } from '#server/api.ts';
import { json } from '#server/http.ts';
import * as emer from '#server/servicios/emergencias.ts';

/** Un Guardián marca la emergencia como atendida (termina el modo emergencia). */
export const POST = conSesion(async ({ db, s, event }) => json(await enTx(db, (tx) => emer.atender(tx, s, param(event, 'emergenciaId')))));
