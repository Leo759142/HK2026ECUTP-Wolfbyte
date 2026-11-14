import { n as conSesion, r as enTx, t as bool } from "../../../../../chunks/api.js";
import { i as leerJson, r as json } from "../../../../../chunks/http.js";
import { c as listarServicios } from "../../../../../chunks/servicios.js";
import { r as crear, t as CATEGORIAS } from "../../../../../chunks/servicios2.js";
import { u as opcion } from "../../../../../chunks/validar.js";
// src/routes/api/v1/servicios/+server.ts
/** Mismo orden que la pantalla de Resultados (frontend: ORDEN en Servicios.jsx). */
var ORDEN = {
	recomendados_cerca: (a, b) => b.total_vistos_buenos - b.distancia_cuadras * 2 - (a.total_vistos_buenos - a.distancia_cuadras * 2),
	cercania: (a, b) => a.distancia_cuadras - b.distancia_cuadras || b.total_vistos_buenos - a.total_vistos_buenos,
	vistos_buenos: (a, b) => b.total_vistos_buenos - a.total_vistos_buenos
};
var GET = conSesion(async ({ db, s, event }) => {
	const q = event.url.searchParams;
	const orden = opcion(q.get("orden") ?? "recomendados_cerca", "orden", [
		"recomendados_cerca",
		"cercania",
		"vistos_buenos"
	]);
	const limite = Math.min(50, Math.max(1, Number(q.get("limite") ?? 20) || 20));
	const desde = Math.max(0, Number(q.get("cursor") ?? 0) || 0);
	const lista = (await listarServicios(db, {
		sectorId: s.sectorId,
		yo: s.usuarioId,
		miManzana: s.manzana,
		categoria: q.get("categoria") ? opcion(q.get("categoria"), "categoria", CATEGORIAS) : null,
		clase: q.get("clase") ? opcion(q.get("clase"), "clase", ["servicio", "producto"]) : null,
		q: q.get("q")?.slice(0, 60) || null,
		mios: bool(q.get("mios")),
		soloRecomendados: bool(q.get("solo_recomendados"))
	})).sort(ORDEN[orden]);
	const items = lista.slice(desde, desde + limite);
	return json({
		items,
		siguiente_cursor: desde + limite < lista.length ? String(desde + limite) : null
	});
});
var POST = conSesion(async ({ db, s, event }) => {
	const body = await leerJson(event.request);
	const r = await enTx(db, (tx) => crear(tx, s, body));
	return json(r.servicio, r.creado ? 201 : 200);
});
export { GET, POST };

//# sourceMappingURL=_server.ts.js.map