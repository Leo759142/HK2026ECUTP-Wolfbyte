import { i as param, n as conSesion, r as enTx } from "../../../../../../chunks/api.js";
import { i as leerJson, o as sinContenido, r as json } from "../../../../../../chunks/http.js";
import { a as eliminar, i as editar, r as detalle } from "../../../../../../chunks/favores2.js";
// src/routes/api/v1/favores/[favorId]/+server.ts
var GET = conSesion(async ({ db, s, event }) => json(await detalle(db, s, param(event, "favorId"))));
var PATCH = conSesion(async ({ db, s, event }) => {
	const body = await leerJson(event.request);
	return json(await enTx(db, (tx) => editar(tx, s, param(event, "favorId"), body)));
});
var DELETE = conSesion(async ({ db, s, event }) => {
	await enTx(db, (tx) => eliminar(tx, s, param(event, "favorId")));
	return sinContenido();
});
export { DELETE, GET, PATCH };

//# sourceMappingURL=_server.ts.js.map