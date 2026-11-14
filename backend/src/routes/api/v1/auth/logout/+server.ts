import { publico } from '#server/api.ts';
import { sinContenido } from '#server/http.ts';
import { borrarCookie, revocarSesion } from '#server/auth/sesion.ts';

export const POST = publico(async ({ db, event }) => {
	const id = event.locals.sesion?.sesionId ?? event.locals.registro?.sesionId;
	if (id) await revocarSesion(db, id);
	borrarCookie(event.cookies);
	return sinContenido();
});
