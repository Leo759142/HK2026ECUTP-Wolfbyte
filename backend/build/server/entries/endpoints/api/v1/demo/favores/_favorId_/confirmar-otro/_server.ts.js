import { i as param, n as conSesion, r as enTx } from "../../../../../../../../chunks/api.js";
import { o as sinContenido } from "../../../../../../../../chunks/http.js";
import { n as confirmarOtroLado, r as exigirDemo } from "../../../../../../../../chunks/demo.js";
// src/routes/api/v1/demo/favores/[favorId]/confirmar-otro/+server.ts
/** Demo: simular que la otra persona también pulsó "Listo". Solo con AYNI_DEMO=true. */
var POST = conSesion(async ({ db, s, event }) => {
	exigirDemo();
	await enTx(db, (tx) => confirmarOtroLado(tx, s, param(event, "favorId")));
	return sinContenido();
});
export { POST };

//# sourceMappingURL=_server.ts.js.map