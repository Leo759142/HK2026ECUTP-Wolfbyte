import { i as param, n as conSesion, r as enTx } from "../../../../../../../chunks/api.js";
import { i as leerJson, o as sinContenido } from "../../../../../../../chunks/http.js";
import { t as acusar } from "../../../../../../../chunks/emergencias.js";
// src/routes/api/v1/emergencias/[emergenciaId]/acuse/+server.ts
var PUT = conSesion(async ({ db, s, event }) => {
	const body = await leerJson(event.request);
	await enTx(db, (tx) => acusar(tx, s, param(event, "emergenciaId"), body));
	return sinContenido();
});
export { PUT };

//# sourceMappingURL=_server.ts.js.map