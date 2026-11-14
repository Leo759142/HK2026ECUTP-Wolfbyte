import { i as param, n as conSesion } from "../../../../../../chunks/api.js";
import { n as err, r as json } from "../../../../../../chunks/http.js";
import { o as obtenerSector } from "../../../../../../chunks/sectores.js";
import { m as uuid } from "../../../../../../chunks/validar.js";
// src/routes/api/v1/sectores/[sectorId]/+server.ts
var GET = conSesion(async ({ db, event }) => {
	const s = await obtenerSector(db, uuid(param(event, "sectorId"), "El sector"));
	if (!s) throw err.noEncontrado();
	return json(s);
});
export { GET };

//# sourceMappingURL=_server.ts.js.map