import { n as conSesion } from "../../../../../chunks/api.js";
import { r as json } from "../../../../../chunks/http.js";
import { l as recursoValido, p as listarGrupos } from "../../../../../chunks/emergencias.js";
// src/routes/api/v1/grupos-apoyo/+server.ts
var GET = conSesion(async ({ db, s, event }) => {
	const recurso = recursoValido(event.url.searchParams.get("recurso"));
	return json(await listarGrupos(db, s.sectorId, { recurso }));
});
export { GET };

//# sourceMappingURL=_server.ts.js.map