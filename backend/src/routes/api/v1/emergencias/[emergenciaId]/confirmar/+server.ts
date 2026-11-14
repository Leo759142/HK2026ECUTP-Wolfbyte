import { conSesion, enTx, param } from '#server/api.ts';
import { json } from '#server/http.ts';
import * as emer from '#server/servicios/emergencias.ts';

/** Un Guardián confirma; con las confirmaciones requeridas la emergencia pasa a activa. */
export const POST = conSesion(async ({ db, s, event }) => json(await enTx(db, (tx) => emer.confirmar(tx, s, param(event, 'emergenciaId')))));
