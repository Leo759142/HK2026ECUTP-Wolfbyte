import { i as param, n as conSesion } from "../../../../../../chunks/api.js";
import { n as err, r as json } from "../../../../../../chunks/http.js";
import { a as perfilVecino } from "../../../../../../chunks/usuarios.js";
import { m as uuid } from "../../../../../../chunks/validar.js";
// src/routes/api/v1/usuarios/[usuarioId]/+server.ts
/** Perfil público de un vecino de mi sector, con su Balance de Ayni. */
var GET = conSesion(async ({ db, s, event }) => {
	const p = await perfilVecino(db, uuid(param(event, "usuarioId"), "El vecino"), s.sectorId);
	if (!p) throw err.noEncontrado();
	return json(p);
});
export { GET };

//# sourceMappingURL=_server.ts.js.map