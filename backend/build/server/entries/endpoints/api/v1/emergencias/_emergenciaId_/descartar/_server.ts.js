import { i as param, n as conSesion, r as enTx } from "../../../../../../../chunks/api.js";
import { i as leerJson, r as json } from "../../../../../../../chunks/http.js";
import { a as descartar } from "../../../../../../../chunks/emergencias.js";
// src/routes/api/v1/emergencias/[emergenciaId]/descartar/+server.ts
var POST = conSesion(async ({ db, s, event }) => {
	const body = await leerJson(event.request);
	return json(await enTx(db, (tx) => descartar(tx, s, param(event, "emergenciaId"), body)));
});
export { POST };

//# sourceMappingURL=_server.ts.js.map