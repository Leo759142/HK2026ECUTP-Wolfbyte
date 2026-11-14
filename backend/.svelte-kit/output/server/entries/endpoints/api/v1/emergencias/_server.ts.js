import { n as conSesion, r as enTx } from "../../../../../chunks/api.js";
import { i as leerJson, r as json } from "../../../../../chunks/http.js";
import { f as listarEmergencias, o as lector, u as reportar } from "../../../../../chunks/emergencias.js";
import { u as opcion } from "../../../../../chunks/validar.js";
// src/routes/api/v1/emergencias/+server.ts
/** El Guardián ve también las pendientes; el vecino, las activas/atendidas y las que reportó. */
var GET = conSesion(async ({ db, s, event }) => {
	const e = event.url.searchParams.get("estado");
	const estado = e ? opcion(e, "estado", [
		"pendiente",
		"activa",
		"descartada",
		"atendida"
	]) : null;
	return json(await listarEmergencias(db, lector(s), { estado }));
});
var POST = conSesion(async ({ db, s, event }) => {
	const body = await leerJson(event.request);
	const r = await enTx(db, (tx) => reportar(tx, s, body));
	return json(r.emergencia, r.creada ? 201 : 200);
});
export { GET, POST };

//# sourceMappingURL=_server.ts.js.map