import { n as conSesion } from "../../../../../../chunks/api.js";
import { o as sinContenido } from "../../../../../../chunks/http.js";
import { t as borrarCookie } from "../../../../../../chunks/sesion.js";
import { i as reiniciar, r as exigirDemo } from "../../../../../../chunks/demo.js";
// src/routes/api/v1/demo/reiniciar/+server.ts
/** Demo: borra TODOS los datos y vuelve al sector de ejemplo (cierra todas las sesiones). Solo con AYNI_DEMO=true. */
var POST = conSesion(async ({ db, event }) => {
	exigirDemo();
	await reiniciar(db);
	borrarCookie(event.cookies);
	return sinContenido();
});
export { POST };

//# sourceMappingURL=_server.ts.js.map