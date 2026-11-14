import { conSesion, param } from '#server/api.ts';
import { err, json } from '#server/http.ts';
import { perfilVecino } from '#server/repositorios/usuarios.ts';
import { uuid } from '#server/validar.ts';

/** Perfil público de un vecino de mi sector, con su Balance de Ayni. */
export const GET = conSesion(async ({ db, s, event }) => {
	const p = await perfilVecino(db, uuid(param(event, 'usuarioId'), 'El vecino'), s.sectorId);
	if (!p) throw err.noEncontrado();
	return json(p);
});
