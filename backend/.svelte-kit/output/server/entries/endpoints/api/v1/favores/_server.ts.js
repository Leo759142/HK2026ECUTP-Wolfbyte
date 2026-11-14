import { n as conSesion, r as enTx, t as bool } from "../../../../../chunks/api.js";
import { i as leerJson, r as json } from "../../../../../chunks/http.js";
import { c as liberarReservasVencidas, l as listarFavores } from "../../../../../chunks/favores.js";
import { n as crear, t as TIPOS } from "../../../../../chunks/favores2.js";
import { u as opcion } from "../../../../../chunks/validar.js";
// src/routes/api/v1/favores/+server.ts
/** Muro de favores de mi sector. Antes de responder se liberan las reservas de más de 1 hora. */
var GET = conSesion(async ({ db, s, event }) => {
	const q = event.url.searchParams;
	await liberarReservasVencidas(db);
	const limite = Math.min(50, Math.max(1, Number(q.get("limite") ?? 20) || 20));
	const desde = Math.max(0, Number(q.get("cursor") ?? 0) || 0);
	const lista = await listarFavores(db, {
		sectorId: s.sectorId,
		yo: s.usuarioId,
		tipo: q.get("tipo") ? opcion(q.get("tipo"), "tipo", TIPOS) : null,
		estado: q.get("estado") ? opcion(q.get("estado"), "estado", [
			"disponible",
			"reservado",
			"cerrado"
		]) : null,
		mios: bool(q.get("mios"))
	});
	return json({
		items: lista.slice(desde, desde + limite),
		siguiente_cursor: desde + limite < lista.length ? String(desde + limite) : null
	});
});
var POST = conSesion(async ({ db, s, event }) => {
	const body = await leerJson(event.request);
	const r = await enTx(db, (tx) => crear(tx, s, body));
	return json(r.favor, r.creado ? 201 : 200);
});
export { GET, POST };

//# sourceMappingURL=_server.ts.js.map