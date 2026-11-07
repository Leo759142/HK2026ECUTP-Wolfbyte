import { ok, problem, requireIdempotency } from '../../_http';
import { enmascararCoordenadas } from '../../../../dominio/tipos/geohash';
import { dao } from '../../../../datos/dao';

const SEEDS_ALERTAS: Array<Record<string, unknown>> = [
	{ id: 'a1', zona_id: 'z1', tipo: 'zona_inundada', descripcion: 'Calle principal inundada por lluvias.', usuario_id: 'u1', lat_aprox: -12.046, lng_aprox: -77.043, estado: 'sin_verificar', oculto: 0, creado_en: new Date().toISOString(), actualizado_en: new Date().toISOString() },
	{ id: 'a2', zona_id: 'z1', tipo: 'via_bloqueada', descripcion: 'Árbol caído bloquea el paso vehicular.', usuario_id: 'u2', lat_aprox: -12.047, lng_aprox: -77.044, estado: 'confirmado_vecinos', oculto: 0, creado_en: new Date().toISOString(), actualizado_en: new Date().toISOString() }
];

async function seedDemo() {
	const existentes = await dao.listarLocal<Record<string, unknown>>('alertas');
	if (existentes.length === 0) {
		for (const a of SEEDS_ALERTAS) await dao.aplicarLocal('alertas', a);
	}
}

void seedDemo();

export const GET = async ({ url }) => {
	const zona = url.searchParams.get('zona_id');
	const limite = url.searchParams.get('limite');
	const offset = url.searchParams.get('offset');
	const paginado = await dao.listarLocalPaginado<Record<string, unknown>>('alertas', { limite: limite ? Number(limite) : undefined, offset: offset ? Number(offset) : undefined });
	const filtered = paginado.items.filter((a) => !zona || a.zona_id === zona);
	return ok({ items: filtered, total: paginado.total });
};
export const POST = async ({ request }) => {
	const key = requireIdempotency(request);
	if (!(typeof key === 'string')) return key;
	const b = (await request.json().catch(() => null)) as Record<string, unknown> | null;
	if (!b || typeof b !== 'object' || Array.isArray(b) || !b.zona_id || !b.tipo || !b.descripcion)
		return problem(422, 'Campos requeridos', 'zona_id, tipo, descripcion, lat_aprox, lng_aprox');
	const existente = await dao.obtenerLocal<Record<string, unknown>>('alertas', key);
	if (existente) return ok(existente, 200, { 'Idempotent-Replayed': 'true' });
	const aprox = b.lat_aprox != null && b.lng_aprox != null ? enmascararCoordenadas(Number(b.lat_aprox), Number(b.lng_aprox)) : {};
	const item = { id: key, emergencia_id: b.emergencia_id ?? null, usuario_id: 'demo', estado: 'sin_verificar', oculto: 0, creado_en: new Date().toISOString(), actualizado_en: new Date().toISOString(), ...b, ...aprox };
	await dao.aplicarLocal('alertas', item);
	return ok(item, 201);
};

export async function _actualizarAlerta(id: string, cambios: Record<string, unknown>): Promise<Record<string, unknown> | null> {
	const existente = await dao.obtenerLocal<Record<string, unknown>>('alertas', id);
	if (!existente) return null;
	const actualizado = { ...existente, ...cambios, actualizado_en: new Date().toISOString() };
	await dao.aplicarLocal('alertas', actualizado);
	return actualizado;
}

export async function _eliminarAlerta(id: string): Promise<boolean> {
	const existente = await dao.obtenerLocal<Record<string, unknown>>('alertas', id);
	if (!existente) return false;
	await dao.eliminarLocal('alertas', id);
	return true;
}
