import { i as param, n as conSesion, r as enTx } from "../../../../../../../chunks/api.js";
import { r as json } from "../../../../../../../chunks/http.js";
import { s as listo } from "../../../../../../../chunks/favores2.js";
// src/routes/api/v1/favores/[favorId]/listo/+server.ts
/** Botón "Listo": cuando ambos lo pulsan el favor se cierra y suma al Balance de Ayni. */
var POST = conSesion(async ({ db, s, event }) => json(await enTx(db, (tx) => listo(tx, s, param(event, "favorId")))));
export { POST };

//# sourceMappingURL=_server.ts.js.map