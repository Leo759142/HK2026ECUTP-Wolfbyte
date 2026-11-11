import type { RequestHandler } from './';
import { ok, problem, requireIdempotency } from '../../../_http';
import { listarEntidad, obtenerEntidad, aplicarEntidadLWW } from '../../../_dao-repo';

const TIPOS_VALIDOS = new Set(['visto_bueno', 'retiro']);

export const POST: RequestHandler = async ({ request, params }) => {
	const key = requireIdempotency(request);
	if (typeof key !== 'string') return key;
	const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
	if (!body || typeof body !== 'object' || Array.isArray(body))
		return problem(400, 'JSON inválido', 'El cuerpo debe ser un objeto JSON.');
	if (
		!TIPOS_VALIDOS.has(String(body.tipo)) ||
		typeof body.misma_zona !== 'boolean' ||
		typeof body.dispositivo_hash !== 'string' ||
		!body.dispositivo_hash.trim()
	)
		return problem(422, 'Campos requeridos', 'tipo, misma_zona, dispositivo_hash');
	if (typeof body.comentario === 'string' && body.comentario.trim().length > 140)
		return problem(422, 'Comentario inválido', 'comentario no puede superar 140 caracteres.');
	const servicioExiste = (await listarEntidad('servicios')).some((s) => s.id === params.id);
	if (!servicioExiste) return problem(404, 'Servicio no encontrado', 'El servicio_id no existe.');
	const existente = await obtenerEntidad('recomendaciones', key);
	if (existente) return ok({ ok: true, replayed: true }, 200, { 'Idempotent-Replayed': 'true' });
	const evento = {
		id: key,
		servicio_id: params.id,
		usuario_id: typeof body.usuario_id === 'string' ? body.usuario_id : undefined,
		tipo: body.tipo,
		misma_zona: body.misma_zona,
		dispositivo_hash: body.dispositivo_hash.trim(),
		comentario: typeof body.comentario === 'string' ? body.comentario.trim() : null,
		creado_en: new Date().toISOString()
	};
	await aplicarEntidadLWW('recomendaciones', evento);
	return ok({ ok: true, id: key, servicio_id: params.id }, 201);
};

export const GET: RequestHandler = async ({ url }) => {
	const servicioId = url.searchParams.get('servicio_id');
	const items = await listarEntidad('recomendaciones', (r) => {
		if (servicioId && r.servicio_id !== servicioId) return false;
		return true;
	});
	return ok({ items, total: items.length });
};
