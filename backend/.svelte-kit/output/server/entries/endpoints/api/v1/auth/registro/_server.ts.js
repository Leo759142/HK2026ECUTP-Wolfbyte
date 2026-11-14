import { a as publico } from "../../../../../../chunks/api.js";
import { i as leerJson, n as err, r as json } from "../../../../../../chunks/http.js";
import { r as guardarCookie } from "../../../../../../chunks/sesion.js";
import { r as registrar } from "../../../../../../chunks/cuentas.js";
// src/routes/api/v1/auth/registro/+server.ts
/** Crea la cuenta con el token de registro que entregó /auth/otp/verificar. */
var POST = publico(async ({ db, event }) => {
	if (event.locals.sesion) throw err.conflicto("Ya tienes una sesión iniciada.", "YA_REGISTRADO");
	const registro = event.locals.registro;
	if (!registro) throw err.noAutorizado("Primero verifica tu celular con el código SMS.", "VERIFICACION_REQUERIDA");
	const r = await registrar(db, registro, await leerJson(event.request));
	guardarCookie(event.cookies, r.token, r.expira);
	return json({
		tipo: r.tipo,
		token: r.token,
		usuario: r.usuario
	}, 201);
});
export { POST };

//# sourceMappingURL=_server.ts.js.map