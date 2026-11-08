import type { RequestHandler } from './$types';
import { ok, problem, requireIdempotency } from '../../../../_http';
import { dao } from '../../../../../../datos/dao';

const ENTIDAD_CONFIRMACIONES = 'favor_confirmaciones';
export const POST = async ({ request, params }) => {
	const key = requireIdempotency(request);
	if (!(typeof key === 'string')) return key;
	const b = (await request.json().catch(() => null)) as Record<string, unknown> | null;
	if (!b?.rol_en_favor || !b?.metodo) return problem(422, 'rol_en_favor y metodo requeridos');
	const existente = await dao.obtenerLocal<Record<string, unknown>>(ENTIDAD_CONFIRMACIONES, key);
	if (existente) return ok({ ok: true, replayed: true }, 200, { 'Idempotent-Replayed': 'true' });
	const conf = { id: key, favor_id: params.id, usuario_id: String(b.usuario_id ?? 'demo'), ...b, confirmado_en: new Date().toISOString() };
	await dao.aplicarLocal(ENTIDAD_CONFIRMACIONES, conf);
	const favor = (await dao.obtenerLocal<Record<string, unknown>>('favores', params.id)) as any;
	if (favor?.ayudante_id && favor?.creador_id) {
		const todas = await dao.listarLocal<Record<string, unknown>>(ENTIDAD_CONFIRMACIONES);
		const delFavor = todas.filter((c) => c.favor_id === params.id);
		const okSol = delFavor.some((c) => c.usuario_id === favor.creador_id && c.rol_en_favor === 'solicitante');
		const okAyu = delFavor.some((c) => c.usuario_id === favor.ayudante_id && c.rol_en_favor === 'ayudante');
		if (okSol && okAyu) {
			await dao.aplicarLocal('favores', { ...favor, estado: 'cerrado', cerrado_en: new Date().toISOString() });
		}
	}
	const favorActualizado = (await dao.obtenerLocal<Record<string, unknown>>('favores', params.id)) as any;
	return ok({ ok: true, id: key, favor_estado: favorActualizado?.estado }, 201);
};

export async function _listarConfirmacionesPorFavor(favorId: string): Promise<Record<string, unknown>[]> {
	const todas = await dao.listarLocal<Record<string, unknown>>(ENTIDAD_CONFIRMACIONES);
	return todas.filter((c) => c.favor_id === favorId);
}

export async function _actualizarConfirmacion(id: string, cambios: Record<string, unknown>): Promise<Record<string, unknown> | null> {
	const existente = await dao.obtenerLocal<Record<string, unknown>>(ENTIDAD_CONFIRMACIONES, id);
	if (!existente) return null;
	const actualizado = { ...existente, ...cambios };
	await dao.aplicarLocal(ENTIDAD_CONFIRMACIONES, actualizado);
	return actualizado;
}

export async function _eliminarConfirmacion(id: string): Promise<boolean> {
	const existente = await dao.obtenerLocal<Record<string, unknown>>(ENTIDAD_CONFIRMACIONES, id);
	if (!existente) return false;
	await dao.eliminarLocal(ENTIDAD_CONFIRMACIONES, id);
	return true;
}
