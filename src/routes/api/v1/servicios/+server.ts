import { ok, problem, requireIdempotency } from '../../_http';
import { CATEGORIAS_SERVICIO } from '../../../../dominio/tipos/tipos';
import { enmascararCoordenadas } from '../../../../dominio/tipos/geohash';

const memoria: Array<Record<string, unknown>> = [];
const seeds = [
	{ id: 's1', zona_id: 'z1', categoria: 'gasfiteria', titulo: 'Gasfitero 24h', descripcion: 'Reparación de fugas y desagües.', lat_aprox: -12.05, lng_aprox: -77.04, usuario_id: 'u2', es_emprendimiento: 1, activo: 1, oculto: 0, creado_en: new Date().toISOString(), actualizado_en: new Date().toISOString() },
	{ id: 's2', zona_id: 'z1', categoria: 'costura', titulo: 'Costurera del barrio', descripcion: 'Arreglos y confección.', lat_aprox: -12.051, lng_aprox: -77.041, usuario_id: 'u3', es_emprendimiento: 1, activo: 1, oculto: 0, creado_en: new Date().toISOString(), actualizado_en: new Date().toISOString() }
];
for (const s of seeds) if (!memoria.some((m) => m.id === s.id)) memoria.push({ ...s });

export const GET = async ({ url }) => {
	const zona = url.searchParams.get('zona_id');
	const categoria = url.searchParams.get('categoria');
	const items = memoria.filter((s) => (!zona || s.zona_id === zona) && (!categoria || s.categoria === categoria));
	return ok({ items, nextCursor: null, total: items.length });
};

export const POST = async ({ request }) => {
	const key = requireIdempotency(request);
	if (!(typeof key === 'string')) return key;
	const body = await request.json().catch(() => null);
	if (!body || typeof body !== 'object' || Array.isArray(body)) return problem(400, 'JSON inválido', 'El cuerpo debe ser un objeto JSON.');
	const b = body as Record<string, unknown>;
	if (!b.zona_id || !b.categoria || !b.titulo || !b.descripcion || b.lat_aprox == null || b.lng_aprox == null)
		return problem(422, 'Campos requeridos', 'zona_id, categoria, titulo, descripcion, lat_aprox, lng_aprox');
	if (!CATEGORIAS_SERVICIO.includes(String(b.categoria) as never)) return problem(422, 'Categoría inválida');
	const existente = memoria.find((s) => s.id === key);
	if (existente) return ok(existente, 200, { 'Idempotent-Replayed': 'true' });
	const aprox = enmascararCoordenadas(Number(b.lat_aprox), Number(b.lng_aprox));
	const item = {
		id: key,
		usuario_id: 'demo',
		...b,
		...aprox,
		es_emprendimiento: b.es_emprendimiento ? 1 : 0,
		activo: 1,
		oculto: 0,
		creado_en: new Date().toISOString(),
		actualizado_en: new Date().toISOString()
	};
	memoria.push(item);
	return ok(item, 201);
};
