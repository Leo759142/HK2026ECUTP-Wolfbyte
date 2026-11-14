import { conSesion, enTx, param } from '#server/api.ts';
import { json } from '#server/http.ts';
import * as emer from '#server/servicios/emergencias.ts';

export const POST = conSesion(async ({ db, s, event }) => json(await enTx(db, (tx) => emer.resolverPedido(tx, s, param(event, 'pedidoId')))));
