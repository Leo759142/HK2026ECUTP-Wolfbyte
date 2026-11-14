import { conSesion } from '#server/api.ts';
import { json } from '#server/http.ts';
import { listarGrupos } from '#server/repositorios/emergencias.ts';
import { recursoValido } from '#server/servicios/emergencias.ts';

export const GET = conSesion(async ({ db, s, event }) => {
	const recurso = recursoValido(event.url.searchParams.get('recurso'));
	return json(await listarGrupos(db, s.sectorId, { recurso }));
});
