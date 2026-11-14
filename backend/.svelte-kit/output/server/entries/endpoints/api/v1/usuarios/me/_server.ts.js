import { n as conSesion, r as enTx } from "../../../../../../chunks/api.js";
import { i as leerJson, r as json } from "../../../../../../chunks/http.js";
import { t as actualizarPerfil } from "../../../../../../chunks/cuentas.js";
// src/routes/api/v1/usuarios/me/+server.ts
var PATCH = conSesion(async ({ db, s, event }) => {
	const body = await leerJson(event.request);
	return json(await enTx(db, (tx) => actualizarPerfil(tx, s, body)));
});
export { PATCH };

//# sourceMappingURL=_server.ts.js.map