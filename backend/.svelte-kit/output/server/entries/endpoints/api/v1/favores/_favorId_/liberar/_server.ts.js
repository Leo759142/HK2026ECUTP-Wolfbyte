import { i as param, n as conSesion, r as enTx } from "../../../../../../../chunks/api.js";
import { r as json } from "../../../../../../../chunks/http.js";
import { o as liberar } from "../../../../../../../chunks/favores2.js";
// src/routes/api/v1/favores/[favorId]/liberar/+server.ts
var POST = conSesion(async ({ db, s, event }) => json(await enTx(db, (tx) => liberar(tx, s, param(event, "favorId")))));
export { POST };

//# sourceMappingURL=_server.ts.js.map