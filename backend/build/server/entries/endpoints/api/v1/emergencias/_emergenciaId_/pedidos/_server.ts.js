import { i as param, n as conSesion, r as enTx } from "../../../../../../../chunks/api.js";
import { i as leerJson, r as json } from "../../../../../../../chunks/http.js";
import { c as pedirAyuda, s as listarPedidos } from "../../../../../../../chunks/emergencias.js";
// src/routes/api/v1/emergencias/[emergenciaId]/pedidos/+server.ts
var GET = conSesion(async ({ db, s, event }) => json(await listarPedidos(db, s, param(event, "emergenciaId"))));
var POST = conSesion(async ({ db, s, event }) => {
	const body = await leerJson(event.request);
	const r = await enTx(db, (tx) => pedirAyuda(tx, s, param(event, "emergenciaId"), body));
	return json(r.pedido, r.creado ? 201 : 200);
});
export { GET, POST };

//# sourceMappingURL=_server.ts.js.map