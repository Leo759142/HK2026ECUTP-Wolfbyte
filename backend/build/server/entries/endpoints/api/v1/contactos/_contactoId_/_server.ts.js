import { i as param, n as conSesion, r as enTx } from "../../../../../../chunks/api.js";
import { i as leerJson, r as json } from "../../../../../../chunks/http.js";
import { c as responderContacto } from "../../../../../../chunks/servicios2.js";
// src/routes/api/v1/contactos/[contactoId]/+server.ts
var PATCH = conSesion(async ({ db, s, event }) => {
	const body = await leerJson(event.request);
	return json(await enTx(db, (tx) => responderContacto(tx, s, param(event, "contactoId"), body)));
});
export { PATCH };

//# sourceMappingURL=_server.ts.js.map