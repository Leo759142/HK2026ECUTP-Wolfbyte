import { publico } from '#server/api.ts';
import { err, json, leerJson } from '#server/http.ts';
import { guardarCookie } from '#server/auth/sesion.ts';
import * as cuentas from '#server/servicios/cuentas.ts';

/** Crea la cuenta con el token de registro que entregó /auth/otp/verificar. */
export const POST = publico(async ({ db, event }) => {
	if (event.locals.sesion) throw err.conflicto('Ya tienes una sesión iniciada.', 'YA_REGISTRADO');
	const registro = event.locals.registro;
	if (!registro) throw err.noAutorizado('Primero verifica tu celular con el código SMS.', 'VERIFICACION_REQUERIDA');
	const r = await cuentas.registrar(db, registro, await leerJson(event.request));
	guardarCookie(event.cookies, r.token, r.expira);
	return json({ tipo: r.tipo, token: r.token, usuario: r.usuario }, 201);
});
