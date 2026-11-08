import type { RequestHandler } from './$types';
import { ok, problem, requireIdempotency } from '../../_http';
import { store } from '../../_store';
import { elegir, errorTextos, esRespuesta, leerCoordenadas, leerObjeto } from '../../_validar';
import { CATEGORIAS_SERVICIO, type CategoriaServicio } from '../../../../dominio/tipos/tipos';
import { enmascararCoordenadas } from '../../../../dominio/tipos/geohash';

const CAMPOS = ['zona_id', 'categoria', 'titulo', 'descripcion'] as const;

export const GET: RequestHandler = async ({ url }) => {
	const zona = url.searchParams.get('zona_id');
	const categoria = url.searchParams.get('categoria');
	const items = store.servicios.filter((s) => s.oculto === 0 && (!zona || s.zona_id === zona) && (!categoria || s.categoria === categoria));
	return ok({ items, nextCursor: null, total: items.length });
};

export const POST: RequestHandler = async ({ request }) => {
	const key = requireIdempotency(request);
	if (!(typeof key === 'string')) return key;
	const b = await leerObjeto(request);
	if (esRespuesta(b)) return b;

	const errTexto = errorTextos(b, { zona_id: { max: 64 }, titulo: { min: 3, max: 80 }, descripcion: { max: 500 } });
	if (errTexto) return problem(422, 'Datos inválidos', errTexto);
	if (!CATEGORIAS_SERVICIO.includes(String(b.categoria) as CategoriaServicio)) return problem(422, 'Categoría inválida');
	const coords = leerCoordenadas(b, true);
	if (esRespuesta(coords)) return coords;
	if (!coords) return problem(422, 'Coordenadas requeridas', 'Incluye lat_aprox y lng_aprox.');

	const existente = store.servicios.find((s) => s.id === key);
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
	store.servicios.push(item);
	return ok(item, 201);
};
