import type { RequestHandler } from './$types';
import { ok, problem, requireIdempotency } from '../../../../_http';
import { store } from '../../../../_store';
import { errorTextos, esRespuesta, leerObjeto } from '../../../../_validar';
import { TIPOS_RECOMENDACION, type TipoRecomendacionEvento } from '../../../../../../dominio/tipos/tipos';

export const POST: RequestHandler = async ({ request, params }) => {
	const key = requireIdempotency(request);
	if (!(typeof key === 'string')) return key;
	const b = await leerObjeto(request);
	if (esRespuesta(b)) return b;

	if (!b.tipo || b.misma_zona === undefined || !b.dispositivo_hash) return problem(422, 'Campos requeridos', 'tipo, misma_zona, dispositivo_hash');
	if (!TIPOS_RECOMENDACION.includes(String(b.tipo) as TipoRecomendacionEvento)) return problem(422, 'Tipo inválido', `tipo debe ser: ${TIPOS_RECOMENDACION.join(', ')}.`);
	const errTexto = errorTextos(b, { dispositivo_hash: { max: 128 }, comentario: { max: 140, requerido: false } });
	if (errTexto) return problem(422, 'Datos inválidos', errTexto);

	if (store.recomendaciones.some((e) => e.id === key)) return ok({ ok: true, replayed: true }, 200, { 'Idempotent-Replayed': 'true' });
	store.recomendaciones.push({
		id: key,
		servicio_id: params.id,
		tipo: b.tipo,
		comentario: typeof b.comentario === 'string' ? b.comentario.trim() : null,
		misma_zona: b.misma_zona ? 1 : 0,
		dispositivo_hash: String(b.dispositivo_hash).trim(),
		creado_en: new Date().toISOString()
	});
	return ok({ ok: true, id: key, servicio_id: params.id }, 201);
};
