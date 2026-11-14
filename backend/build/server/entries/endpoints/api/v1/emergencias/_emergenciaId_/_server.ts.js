import { i as param, n as conSesion } from "../../../../../../chunks/api.js";
import { n as err, r as json } from "../../../../../../chunks/http.js";
import { h as obtenerEmergencia, o as lector } from "../../../../../../chunks/emergencias.js";
import { m as uuid } from "../../../../../../chunks/validar.js";
// src/routes/api/v1/emergencias/[emergenciaId]/+server.ts
var GET = conSesion(async ({ db, s, event }) => {
	const e = await obtenerEmergencia(db, lector(s), uuid(param(event, "emergenciaId"), "La emergencia"));
	if (!e) throw err.noEncontrado();
	return json(e);
});
export { GET };

//# sourceMappingURL=_server.ts.js.map