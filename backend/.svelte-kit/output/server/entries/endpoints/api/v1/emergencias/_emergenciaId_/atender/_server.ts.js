import { i as param, n as conSesion, r as enTx } from "../../../../../../../chunks/api.js";
import { r as json } from "../../../../../../../chunks/http.js";
import { n as atender } from "../../../../../../../chunks/emergencias.js";
// src/routes/api/v1/emergencias/[emergenciaId]/atender/+server.ts
/** Un Guardián marca la emergencia como atendida (termina el modo emergencia). */
var POST = conSesion(async ({ db, s, event }) => json(await enTx(db, (tx) => atender(tx, s, param(event, "emergenciaId")))));
export { POST };

//# sourceMappingURL=_server.ts.js.map