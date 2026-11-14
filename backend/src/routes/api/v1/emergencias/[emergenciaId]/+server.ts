import { conSesion, param } from '#server/api.ts';
import { err, json } from '#server/http.ts';
import { obtenerEmergencia } from '#server/repositorios/emergencias.ts';
import * as emer from '#server/servicios/emergencias.ts';
import { uuid } from '#server/validar.ts';

export const GET = conSesion(async ({ db, s, event }) => {
	const e = await obtenerEmergencia(db, emer.lector(s), uuid(param(event, 'emergenciaId'), 'La emergencia'));
	if (!e) throw err.noEncontrado();
	return json(e);
});
