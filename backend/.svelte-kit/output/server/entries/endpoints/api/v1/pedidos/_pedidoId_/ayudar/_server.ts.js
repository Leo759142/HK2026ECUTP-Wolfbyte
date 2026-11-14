import { i as param, n as conSesion, r as enTx } from "../../../../../../../chunks/api.js";
import { r as json } from "../../../../../../../chunks/http.js";
import { r as ayudar } from "../../../../../../../chunks/emergencias.js";
// src/routes/api/v1/pedidos/[pedidoId]/ayudar/+server.ts
/** "Voy yo": gana el primero. */
var POST = conSesion(async ({ db, s, event }) => json(await enTx(db, (tx) => ayudar(tx, s, param(event, "pedidoId")))));
export { POST };

//# sourceMappingURL=_server.ts.js.map