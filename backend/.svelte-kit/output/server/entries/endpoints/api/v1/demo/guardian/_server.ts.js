import { n as conSesion, r as enTx } from "../../../../../../chunks/api.js";
import { i as leerJson, o as sinContenido } from "../../../../../../chunks/http.js";
import { r as exigirDemo, t as comoGuardian } from "../../../../../../chunks/demo.js";
// src/routes/api/v1/demo/guardian/+server.ts
/** Demo: "Ver AYNI como Guardián". Solo con AYNI_DEMO=true. */
var POST = conSesion(async ({ db, s, event }) => {
	exigirDemo();
	const body = await leerJson(event.request);
	await enTx(db, (tx) => comoGuardian(tx, s, body));
	return sinContenido();
});
export { POST };

//# sourceMappingURL=_server.ts.js.map