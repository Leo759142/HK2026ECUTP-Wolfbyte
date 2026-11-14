import { n as conSesion } from "../../../../../../chunks/api.js";
import { i as leerJson, r as json } from "../../../../../../chunks/http.js";
import { o as tokenDeRequest } from "../../../../../../chunks/sesion.js";
import { n as push } from "../../../../../../chunks/sync.js";
// src/routes/api/v1/sync/push/+server.ts
/** Lote de operaciones hechas sin conexión. Idempotente por op_id. */
var POST = conSesion(async ({ db, s, event }) => {
	const body = await leerJson(event.request);
	return json(await push(db, s, tokenDeRequest(event.request, event.cookies) ?? "", body));
});
export { POST };

//# sourceMappingURL=_server.ts.js.map