import { i as param, n as conSesion, r as enTx } from "../../../../../../../chunks/api.js";
import { r as json } from "../../../../../../../chunks/http.js";
import { u as reservar } from "../../../../../../../chunks/favores2.js";
// src/routes/api/v1/favores/[favorId]/reservar/+server.ts
/** "Lo quiero / Puedo ayudar": reserva por 1 hora, gana el primero. Devuelve el enlace de WhatsApp con el dueño. */
var POST = conSesion(async ({ db, s, event }) => json(await enTx(db, (tx) => reservar(tx, s, param(event, "favorId")))));
export { POST };

//# sourceMappingURL=_server.ts.js.map