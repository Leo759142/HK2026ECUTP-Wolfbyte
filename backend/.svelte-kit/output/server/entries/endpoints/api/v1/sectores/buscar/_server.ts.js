import { a as publico } from "../../../../../../chunks/api.js";
import { r as json } from "../../../../../../chunks/http.js";
import { c as sectorPorUbicacion } from "../../../../../../chunks/sectores.js";
import { n as coordenada } from "../../../../../../chunks/validar.js";
// src/routes/api/v1/sectores/buscar/+server.ts
/** "Encontramos tu zona": el sector cuyo polígono contiene la ubicación, o null (pantalla 0.4). */
var GET = publico(async ({ db, event }) => {
	const q = event.url.searchParams;
	const lat = coordenada(q.get("lat") === null ? null : Number(q.get("lat")), "lat", 90);
	const lng = coordenada(q.get("lng") === null ? null : Number(q.get("lng")), "lng", 180);
	if (lat === null || lng === null) return json(null);
	return json(await sectorPorUbicacion(db, lat, lng));
});
export { GET };

//# sourceMappingURL=_server.ts.js.map