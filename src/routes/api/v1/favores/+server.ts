import { ok, problem, requireIdempotency } from '../../_http';
import { CATEGORIAS_FAVOR, TIPOS_FAVOR } from '../../../../dominio/tipos/tipos';
import { enmascararCoordenadas } from '../../../../dominio/tipos/geohash';
import { ServicioCierreFavor } from '../../../../dominio/favores/cierre';
import { dao } from '../../../../datos/dao';

const SEEDS_FAVORES: Array<Record<string, unknown>> = [
	{ id: 'f1', zona_id: 'z1', tipo: 'prestamo_herramienta', categoria: 'prestamo_herramienta', titulo: 'Préstamo de escalera', descripcion: 'Necesito escalera de 3m por 2 días.', creador_id: 'u1', ayudante_id: null, estado: 'abierto', oculto: 0, agradecimiento: null, cerrado_en: null, lat_aprox: -12.046, lng_aprox: -77.043, creado_en: new Date().toISOString() },
	{ id: 'f2', zona_id: 'z1', tipo: 'necesidad', categoria: 'movilidad', titulo: 'Acompañamiento a cita médica', descripcion: 'Adulto mayor necesita acompañante.', creador_id: 'u4', ayudante_id: 'u2', estado: 'en_curso', oculto: 0, agradecimiento: null, cerrado_en: null, lat_aprox: -12.046, lng_aprox: -77.043, creado_en: new Date().toISOString() }
];

async function seedDemo() {
	const existentes = await dao.listarLocal<Record<string, unknown>>('favores');
	if (existentes.length === 0) {
		for (const f of SEEDS_FAVORES) await dao.aplicarLocal('favores', f);
	}
}

void seedDemo();

export const GET = async ({ url }) => {
	const zona = url.searchParams.get('zona_id');
	const estado = url.searchParams.get('estado');
	const limite = url.searchParams.get('limite');
	const offset = url.searchParams.get('offset');
	const paginado = await dao.listarLocalPaginado<Record<string, unknown>>('favores', { limite: limite ? Number(limite) : undefined, offset: offset ? Number(offset) : undefined });
	const filtered = paginado.items.filter((f) => (!zona || f.zona_id === zona) && (!estado || f.estado === estado));
	return ok({ items: filtered, total: paginado.total });
};

export const POST = async ({ request }) => {
	const key = requireIdempotency(request);
	if (!(typeof key === 'string')) return key;
	const b = (await request.json().catch(() => null)) as Record<string, unknown> | null;
	if (!b?.zona_id || !b?.tipo || !b?.categoria || !b?.titulo || !b?.descripcion) return problem(422, 'Campos requeridos');
	if (!TIPOS_FAVOR.includes(String(b.tipo) as never) || !CATEGORIAS_FAVOR.includes(String(b.categoria) as never)) return problem(422, 'Tipo/categoría inválida');
	const existente = await dao.obtenerLocal<Record<string, unknown>>('favores', key);
	if (existente) return ok(existente, 200, { 'Idempotent-Replayed': 'true' });
	const aprox = b.lat_aprox != null && b.lng_aprox != null ? enmascararCoordenadas(Number(b.lat_aprox), Number(b.lng_aprox)) : { lat_aprox: -12.046, lng_aprox: -77.043 };
	const item = { id: key, creador_id: 'demo', ayudante_id: null, estado: 'abierto', oculto: 0, agradecimiento: null, cerrado_en: null, creado_en: new Date().toISOString(), ...b, ...aprox };
	await dao.aplicarLocal('favores', item);
	return ok(item, 201);
};

export async function _actualizarFavor(id: string, cambios: Record<string, unknown>): Promise<Record<string, unknown> | null> {
	const existente = await dao.obtenerLocal<Record<string, unknown>>('favores', id);
	if (!existente) return null;
	const actualizado = { ...existente, ...cambios, actualizado_en: new Date().toISOString() };
	await dao.aplicarLocal('favores', actualizado);
	return actualizado;
}

export async function _eliminarFavor(id: string): Promise<boolean> {
	const existente = await dao.obtenerLocal<Record<string, unknown>>('favores', id);
	if (!existente) return false;
	await dao.eliminarLocal('favores', id);
	return true;
}

export async function _cerrarSiMutuo(favorId: string) {
	const favor = (await dao.obtenerLocal<Record<string, unknown>>('favores', favorId)) as any;
	if (!favor?.ayudante_id || !favor?.creador_id) return;
	void ServicioCierreFavor;
}
