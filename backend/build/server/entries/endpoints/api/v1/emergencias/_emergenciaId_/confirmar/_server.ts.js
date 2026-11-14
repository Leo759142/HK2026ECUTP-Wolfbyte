import { i as param, n as conSesion, r as enTx } from "../../../../../../../chunks/api.js";
import { r as json } from "../../../../../../../chunks/http.js";
import { i as confirmar } from "../../../../../../../chunks/emergencias.js";
// src/routes/api/v1/emergencias/[emergenciaId]/confirmar/+server.ts
/** Un Guardián confirma; con las confirmaciones requeridas la emergencia pasa a activa. */
var POST = conSesion(async ({ db, s, event }) => json(await enTx(db, (tx) => confirmar(tx, s, param(event, "emergenciaId")))));
export { POST };

//# sourceMappingURL=_server.ts.js.map