import { a as publico } from "../../../../../../../chunks/api.js";
import { i as leerJson, r as json } from "../../../../../../../chunks/http.js";
import { r as guardarCookie } from "../../../../../../../chunks/sesion.js";
import { a as verificar } from "../../../../../../../chunks/cuentas.js";
// src/routes/api/v1/auth/otp/verificar/+server.ts
var POST = publico(async ({ db, event }) => {
	const r = await verificar(db, await leerJson(event.request));
	guardarCookie(event.cookies, r.token, r.expira);
	return json({
		tipo: r.tipo,
		token: r.token,
		usuario: r.usuario ?? null
	});
});
export { POST };

//# sourceMappingURL=_server.ts.js.map