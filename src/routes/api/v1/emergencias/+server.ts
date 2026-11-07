import { ok, problem, requireIdempotency, requireRol } from '../../_http';
import { dao } from '../../../../datos/dao';

const SEEDS_EMERGENCIAS: Array<Record<string, unknown>> = [
	{ id: 'e1', zona_id: 'z1', tipo: 'lluvias_inundacion', titulo: 'Alerta por lluvias intensas', activa: 1, activada_por: 'coordinador', inicio: new Date().toISOString(), fin: null, usuario_id: 'u_coordinador' }
];

async function seedDemo() {
	const existentes = await dao.listarLocal<Record<string, unknown>>('emergencias');
	if (existentes.length === 0) {
		for (const e of SEEDS_EMERGENCIAS) await dao.aplicarLocal('emergencias', e);
	}
}

void seedDemo();

export const GET = async ({ url }) => {
	const zona = url.searchParams.get('zona_id');
	const limite = url.searchParams.get('limite');
	const offset = url.searchParams.get('offset');
	const paginado = await dao.listarLocalPaginado<Record<string, unknown>>('emergencias', { limite: limite ? Number(limite) : undefined, offset: offset ? Number(offset) : undefined });
	const filtered = paginado.items.filter((e) => !zona || e.zona_id === zona);
	return ok({ items: filtered, total: paginado.total });
};

export const POST = async ({ request }) => {
	const rol = requireRol(request, 'activar_emergencia');
	if (!(typeof rol === 'string')) return rol;
	const key = requireIdempotency(request);
	if (!(typeof key === 'string')) return key;
	const b = (await request.json().catch(() => null)) as Record<string, unknown> | null;
	if (!b || typeof b !== 'object' || Array.isArray(b) || !b.zona_id || !b.tipo || !b.titulo)
		return problem(422, 'Campos requeridos', 'zona_id, tipo, titulo');
	const existente = await dao.obtenerLocal<Record<string, unknown>>('emergencias', key);
	if (existente) return ok(existente, 200, { 'Idempotent-Replayed': 'true' });
	const item = { id: key, activa: 1, activada_por: rol, inicio: new Date().toISOString(), fin: null, ...b };
	await dao.aplicarLocal('emergencias', item);
	return ok(item, 201);
};

export async function _actualizarEmergencia(id: string, cambios: Record<string, unknown>): Promise<Record<string, unknown> | null> {
	const existente = await dao.obtenerLocal<Record<string, unknown>>('emergencias', id);
	if (!existente) return null;
	const actualizado = { ...existente, ...cambios, actualizado_en: new Date().toISOString() };
	await dao.aplicarLocal('emergencias', actualizado);
	return actualizado;
}

export async function _eliminarEmergencia(id: string): Promise<boolean> {
	const existente = await dao.obtenerLocal<Record<string, unknown>>('emergencias', id);
	if (!existente) return false;
	await dao.eliminarLocal('emergencias', id);
	return true;
}


