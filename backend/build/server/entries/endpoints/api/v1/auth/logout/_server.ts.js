import { a as publico } from "../../../../../../chunks/api.js";
import { o as sinContenido } from "../../../../../../chunks/http.js";
import { a as revocarSesion, t as borrarCookie } from "../../../../../../chunks/sesion.js";
// src/routes/api/v1/auth/logout/+server.ts
var POST = publico(async ({ db, event }) => {
	const id = event.locals.sesion?.sesionId ?? event.locals.registro?.sesionId;
	if (id) await revocarSesion(db, id);
	borrarCookie(event.cookies);
	return sinContenido();
});
export { POST };

//# sourceMappingURL=_server.ts.js.map