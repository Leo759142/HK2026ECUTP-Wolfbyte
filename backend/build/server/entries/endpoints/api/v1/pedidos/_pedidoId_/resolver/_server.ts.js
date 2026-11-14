import { i as param, n as conSesion, r as enTx } from "../../../../../../../chunks/api.js";
import { r as json } from "../../../../../../../chunks/http.js";
import { d as resolverPedido } from "../../../../../../../chunks/emergencias.js";
// src/routes/api/v1/pedidos/[pedidoId]/resolver/+server.ts
var POST = conSesion(async ({ db, s, event }) => json(await enTx(db, (tx) => resolverPedido(tx, s, param(event, "pedidoId")))));
export { POST };

//# sourceMappingURL=_server.ts.js.map