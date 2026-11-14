import { a as publico } from "../../../../../../../chunks/api.js";
import { t as config } from "../../../../../../../chunks/config2.js";
import { i as leerJson, r as json } from "../../../../../../../chunks/http.js";
import { n as pedirCodigo } from "../../../../../../../chunks/cuentas.js";
// src/routes/api/v1/auth/otp/solicitar/+server.ts
/** 202: el código se envió. No revela si el teléfono ya tiene cuenta. */
var POST = publico(async ({ db, event }) => {
	const r = await pedirCodigo(db, await leerJson(event.request));
	return json({
		enviado: true,
		demo: r.demo,
		...r.demo ? { codigo_demo: config().otpDemo } : {}
	}, 202);
});
export { POST };

//# sourceMappingURL=_server.ts.js.map