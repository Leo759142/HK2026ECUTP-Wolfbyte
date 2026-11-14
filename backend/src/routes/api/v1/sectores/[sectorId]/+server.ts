import { conSesion, param } from '#server/api.ts';
import { err, json } from '#server/http.ts';
import { obtenerSector } from '#server/repositorios/sectores.ts';
import { uuid } from '#server/validar.ts';

export const GET = conSesion(async ({ db, event }) => {
	const s = await obtenerSector(db, uuid(param(event, 'sectorId'), 'El sector'));
	if (!s) throw err.noEncontrado();
	return json(s);
});
