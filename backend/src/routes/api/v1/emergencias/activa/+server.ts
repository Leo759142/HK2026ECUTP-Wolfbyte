import { conSesion } from '#server/api.ts';
import { json } from '#server/http.ts';
import { listarEmergencias } from '#server/repositorios/emergencias.ts';
import * as emer from '#server/servicios/emergencias.ts';

export const GET = conSesion(async ({ db, s }) => {
	const [activa] = await listarEmergencias(db, emer.lector(s), { estado: 'activa' });
	return json(activa ?? null);
});
