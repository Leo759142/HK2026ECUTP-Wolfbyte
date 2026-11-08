import type { RequestHandler } from './$types';
import { ok, problem, requireIdempotency, requireRol } from '../../_http';
import { store } from '../../_store';
import { elegir, errorTextos, esRespuesta, leerObjeto } from '../../_validar';

const CAMPOS = ['zona_id', 'tipo', 'titulo'] as const;

export const POST: RequestHandler = async ({ request }) => {
	const rol = requireRol(request, 'activar_emergencia');
	if (!(typeof rol === 'string')) return rol;
	const key = requireIdempotency(request);
	if (!(typeof key === 'string')) return key;
	const b = await leerObjeto(request);
	if (esRespuesta(b)) return b;

	const errTexto = errorTextos(b, { zona_id: { max: 64 }, tipo: { max: 40 }, titulo: { min: 3, max: 80 } });
	if (errTexto) return problem(422, 'Datos inválidos', errTexto);

	const existente = store.emergencias.find((e) => e.id === key);
	if (existente) return ok(existente, 200, { 'Idempotent-Replayed': 'true' });

	const item = { ...elegir(b, CAMPOS), id: key, activa: 1, activada_por: rol, inicio: new Date().toISOString(), fin: null };
	store.emergencias.push(item);
	return ok(item, 201);
};
