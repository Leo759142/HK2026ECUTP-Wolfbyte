import type { RequestHandler } from './$types';
import { ok, problem, requireIdempotency } from '../../_http';
import { store } from '../../_store';
import { elegir, errorTextos, esRespuesta, leerCoordenadas, leerObjeto } from '../../_validar';
import { CATEGORIAS_SERVICIO, type CategoriaServicio } from '../../../../dominio/tipos/tipos';
import { enmascararCoordenadas } from '../../../../dominio/tipos/geohash';
import { dao } from '../../../../datos/dao';

const SEEDS_SERVICIOS: Array<Record<string, unknown>> = [
	{ id: 's1', zona_id: 'z1', categoria: 'gasfiteria', titulo: 'Gasfitero 24h', descripcion: 'Reparación de fugas y desagües.', lat_aprox: -12.05, lng_aprox: -77.04, usuario_id: 'u2', es_emprendimiento: 1, activo: 1, oculto: 0, creado_en: new Date().toISOString(), actualizado_en: new Date().toISOString() },
	{ id: 's2', zona_id: 'z1', categoria: 'costura', titulo: 'Costurera del barrio', descripcion: 'Arreglos y confección.', lat_aprox: -12.051, lng_aprox: -77.041, usuario_id: 'u3', es_emprendimiento: 1, activo: 1, oculto: 0, creado_en: new Date().toISOString(), actualizado_en: new Date().toISOString() }
];

async function seedDemo() {
	const existentes = await dao.listarLocal<Record<string, unknown>>('servicios');
	if (existentes.length === 0) {
		for (const s of SEEDS_SERVICIOS) await dao.aplicarLocal('servicios', s);
	}
}

void seedDemo();

export const GET: RequestHandler = async ({ url }) => {
	const zona = url.searchParams.get('zona_id');
	const categoria = url.searchParams.get('categoria');
	const limite = url.searchParams.get('limite');
	const offset = url.searchParams.get('offset');
	const paginado = await dao.listarLocalPaginado<Record<string, unknown>>('servicios', { limite: limite ? Number(limite) : undefined, offset: offset ? Number(offset) : undefined });
	const filtered = paginado.items.filter((s) => (!zona || s.zona_id === zona) && (!categoria || s.categoria === categoria));
	return ok({ items: filtered, nextCursor: null, total: paginado.total });
};

export const POST: RequestHandler = async ({ request }) => {
	const key = requireIdempotency(request);
	if (!(typeof key === 'string')) return key;
	const body = await request.json().catch(() => null);
	if (!body || typeof body !== 'object' || Array.isArray(body)) return problem(400, 'JSON inválido', 'El cuerpo debe ser un objeto JSON.');
	const b = body as Record<string, unknown>;
	if (!b.zona_id || !b.categoria || !b.titulo || !b.descripcion || b.lat_aprox == null || b.lng_aprox == null)
		return problem(422, 'Campos requeridos', 'zona_id, categoria, titulo, descripcion, lat_aprox, lng_aprox');
	if (!CATEGORIAS_SERVICIO.includes(String(b.categoria) as never)) return problem(422, 'Categoría inválida');
	const existente = await dao.obtenerLocal<Record<string, unknown>>('servicios', key);
	if (existente) return ok(existente, 200, { 'Idempotent-Replayed': 'true' });

	const ahora = new Date().toISOString();
	const item = {
		...elegir(b, CAMPOS),
		...enmascararCoordenadas(coords.lat, coords.lng),
		id: key,
		usuario_id: 'demo',
		es_emprendimiento: b.es_emprendimiento ? 1 : 0,
		activo: 1,
		oculto: 0,
		creado_en: ahora,
		actualizado_en: ahora
	};
	await dao.aplicarLocal('servicios', item);
	return ok(item, 201);
};

export async function _actualizarServicio(id: string, cambios: Record<string, unknown>): Promise<Record<string, unknown> | null> {
	const existente = await dao.obtenerLocal<Record<string, unknown>>('servicios', id);
	if (!existente) return null;
	const actualizado = { ...existente, ...cambios, actualizado_en: new Date().toISOString() };
	await dao.aplicarLocal('servicios', actualizado);
	return actualizado;
}

export async function _eliminarServicio(id: string): Promise<boolean> {
	const existente = await dao.obtenerLocal<Record<string, unknown>>('servicios', id);
	if (!existente) return false;
	await dao.eliminarLocal('servicios', id);
	return true;
}
