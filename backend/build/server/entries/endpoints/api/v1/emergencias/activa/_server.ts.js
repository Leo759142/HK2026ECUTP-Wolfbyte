import { n as conSesion } from "../../../../../../chunks/api.js";
import { r as json } from "../../../../../../chunks/http.js";
import { f as listarEmergencias, o as lector } from "../../../../../../chunks/emergencias.js";
// src/routes/api/v1/emergencias/activa/+server.ts
var GET = conSesion(async ({ db, s }) => {
	const [activa] = await listarEmergencias(db, lector(s), { estado: "activa" });
	return json(activa ?? null);
});
export { GET };

//# sourceMappingURL=_server.ts.js.map