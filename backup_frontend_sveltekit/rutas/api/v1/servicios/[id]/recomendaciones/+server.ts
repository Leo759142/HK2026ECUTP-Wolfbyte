import type { RequestHandler } from './$types';
import { ok, problem, requireIdempotency } from '../../../../_http';
import { dao } from '../../../../../../datos/dao';

const ENTIDAD_RECOMENDACIONES = 'recomendaciones_eventos';

export const POST = async ({ request, params }) => {
	const key = requireIdempotency(request);
	if (!(typeof key === 'string')) return key;
	const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
	if (!body?.tipo || body.misma_zona === undefined || !body.dispositivo_hash) return problem(422, 'Campos requeridos', 'tipo, misma_zona, dispositivo_hash');
	const existente = await dao.obtenerLocal<Record<string, unknown>>(ENTIDAD_RECOMENDACIONES, key);
	if (existente) return ok({ ok: true, replayed: true }, 200, { 'Idempotent-Replayed': 'true' });
	const evento = { id: key, servicio_id: params.id, ...body, creado_en: new Date().toISOString() };
	await dao.aplicarLocal(ENTIDAD_RECOMENDACIONES, evento);
	return ok({ ok: true, id: key, servicio_id: params.id }, 201);
};

export const GET = async ({ url }) => {
	const servicioId = url.searchParams.get('servicio_id');
	const limite = url.searchParams.get('limite');
	const offset = url.searchParams.get('offset');
	const paginado = await dao.listarLocalPaginado<Record<string, unknown>>(ENTIDAD_RECOMENDACIONES, { limite: limite ? Number(limite) : undefined, offset: offset ? Number(offset) : undefined });
	const filtered = paginado.items.filter((e) => !servicioId || e.servicio_id === servicioId);
	return ok({ items: filtered, total: paginado.total });
};

export async function _listarRecomendacionesPorServicio(servicioId: string): Promise<Record<string, unknown>[]> {
	const todas = await dao.listarLocal<Record<string, unknown>>(ENTIDAD_RECOMENDACIONES);
	return todas.filter((e) => e.servicio_id === servicioId);
}

export async function _actualizarRecomendacion(id: string, cambios: Record<string, unknown>): Promise<Record<string, unknown> | null> {
	const existente = await dao.obtenerLocal<Record<string, unknown>>(ENTIDAD_RECOMENDACIONES, id);
	if (!existente) return null;
	const actualizado = { ...existente, ...cambios };
	await dao.aplicarLocal(ENTIDAD_RECOMENDACIONES, actualizado);
	return actualizado;
}

export async function _eliminarRecomendacion(id: string): Promise<boolean> {
	const existente = await dao.obtenerLocal<Record<string, unknown>>(ENTIDAD_RECOMENDACIONES, id);
	if (!existente) return false;
	await dao.eliminarLocal(ENTIDAD_RECOMENDACIONES, id);
	return true;
}




