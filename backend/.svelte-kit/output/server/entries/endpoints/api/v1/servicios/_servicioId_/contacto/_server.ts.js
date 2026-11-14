import { i as param, n as conSesion, r as enTx } from "../../../../../../../chunks/api.js";
import { r as json } from "../../../../../../../chunks/http.js";
import { n as contactar } from "../../../../../../../chunks/servicios2.js";
// src/routes/api/v1/servicios/[servicioId]/contacto/+server.ts
/** Anota que le escribí por WhatsApp y devuelve el enlace con el mensaje listo (el número no se lista). */
var POST = conSesion(async ({ db, s, event }) => {
	const body = event.request.headers.get("content-type")?.includes("json") ? await event.request.json().catch(() => ({})) : {};
	return json(await enTx(db, (tx) => contactar(tx, s, param(event, "servicioId"), body.id)), 201);
});
export { POST };

//# sourceMappingURL=_server.ts.js.map