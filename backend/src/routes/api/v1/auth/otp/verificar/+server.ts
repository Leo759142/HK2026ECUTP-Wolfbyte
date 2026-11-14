import { publico } from '#server/api.ts';
import { json, leerJson } from '#server/http.ts';
import { guardarCookie } from '#server/auth/sesion.ts';
import * as cuentas from '#server/servicios/cuentas.ts';

export const POST = publico(async ({ db, event }) => {
	const r = await cuentas.verificar(db, await leerJson(event.request));
	guardarCookie(event.cookies, r.token, r.expira);
	return json({ tipo: r.tipo, token: r.token, usuario: r.usuario ?? null });
});
