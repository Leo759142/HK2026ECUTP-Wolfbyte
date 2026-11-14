import { n as conSesion } from "../../../../../../chunks/api.js";
import { i as leerJson, o as sinContenido } from "../../../../../../chunks/http.js";
import { a as simularAntiguedad, r as exigirDemo } from "../../../../../../chunks/demo.js";
// src/routes/api/v1/demo/antiguedad/+server.ts
/** Demo: "Simular 2 meses en AYNI". Solo con AYNI_DEMO=true. */
var POST = conSesion(async ({ db, s, event }) => {
	exigirDemo();
	await simularAntiguedad(db, s, await leerJson(event.request));
	return sinContenido();
});
export { POST };

//# sourceMappingURL=_server.ts.js.map