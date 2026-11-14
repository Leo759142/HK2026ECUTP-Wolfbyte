import { publico } from '#server/api.ts';
import { config } from '#server/config.ts';
import { json, leerJson } from '#server/http.ts';
import * as cuentas from '#server/servicios/cuentas.ts';

/** 202: el código se envió. No revela si el teléfono ya tiene cuenta. */
export const POST = publico(async ({ db, event }) => {
	const r = await cuentas.pedirCodigo(db, await leerJson(event.request));
	return json({ enviado: true, demo: r.demo, ...(r.demo ? { codigo_demo: config().otpDemo } : {}) }, 202);
});
