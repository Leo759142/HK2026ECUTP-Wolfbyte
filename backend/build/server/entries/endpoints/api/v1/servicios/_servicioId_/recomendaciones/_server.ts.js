import { i as param, n as conSesion, r as enTx } from "../../../../../../../chunks/api.js";
import { i as leerJson, r as json } from "../../../../../../../chunks/http.js";
import { p as recomendacionesDeServicio } from "../../../../../../../chunks/servicios.js";
import { i as detalle, s as recomendar } from "../../../../../../../chunks/servicios2.js";
// src/routes/api/v1/servicios/[servicioId]/recomendaciones/+server.ts
var GET = conSesion(async ({ db, s, event }) => {
	const sv = await detalle(db, s, param(event, "servicioId"));
	return json(await recomendacionesDeServicio(db, sv.id));
});
var POST = conSesion(async ({ db, s, event }) => {
	const body = await leerJson(event.request);
	const r = await enTx(db, (tx) => recomendar(tx, s, param(event, "servicioId"), body));
	return json(r.reco, r.creada ? 201 : 200);
});
export { GET, POST };

//# sourceMappingURL=_server.ts.js.map