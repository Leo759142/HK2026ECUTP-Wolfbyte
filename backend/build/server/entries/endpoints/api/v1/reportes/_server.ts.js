import { n as conSesion, r as enTx } from "../../../../../chunks/api.js";
import { i as leerJson, r as json } from "../../../../../chunks/http.js";
import { l as reportar } from "../../../../../chunks/favores2.js";
// src/routes/api/v1/reportes/+server.ts
/** Reportar un servicio o favor. Con 3 reportes pendientes se oculta solo (trigger de la base). */
var POST = conSesion(async ({ db, s, event }) => {
	const body = await leerJson(event.request);
	const r = await enTx(db, (tx) => reportar(tx, s, body));
	return json({
		ok: true,
		mensaje: "Gracias. Un Guardián lo revisará."
	}, r.creado ? 201 : 200);
});
export { POST };

//# sourceMappingURL=_server.ts.js.map