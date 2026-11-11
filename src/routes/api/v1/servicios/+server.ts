import type { RequestHandler } from './';
import { ok, problem, requireIdempotency } from '../../_http';
import { leerObjeto, errorTextos, esRespuesta, leerCoordenadas, elegir, validarFoto } from '../../_validar';
import { listarEntidad, obtenerEntidad, aplicarEntidadLWW } from '../_dao-repo';
import { CATEGORIAS_SERVICIO, type CategoriaServicio } from '../../../../dominio/tipos/tipos';
import { enmascararCoordenadas } from '../../../../dominio/tipos/geohash';

const CAMPOS = [ 'zona_id', 'categoria', 'titulo', 'descripcion', 'foto' ] as const;

export const GET: RequestHandler = async ({ url }) => {
	const zona = url.searchParams.get('zona_id');
	const categoria = url.searchParams.get('categoria');
	const items = await listarEntidad('servicios', (s) => {
		if (s.oculto === 1) return false;
		if (zona && s.zona_id !== zona) return false;
		if (categoria && s.categoria !== categoria) return false;
		return true;
	});
	return ok({ items, nextCursor: null, total: items.length });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const key = requireIdempotency(request);
	if (typeof key !== 'string') return key;
	const b = await leerObjeto(request);
	if (esRespuesta(b)) return b;

	const errTexto = errorTextos(b, {
		zona_id: { max: 64 },
		titulo: { min: 3, max: 80 },
		descripcion: { max: 500 }
	});
	if (errTexto) return problem(422, 'Datos inválidos', errTexto);
	const errFoto = validarFoto(b.foto);
	if (errFoto) return problem(422, 'Foto inválida', errFoto);
	if (!CATEGORIAS_SERVICIO.includes(String(b.categoria) as CategoriaServicio))
		return problem(422, 'Categoría inválida');
	const coords = leerCoordenadas(b, true);
	if (esRespuesta(coords)) return coords;
	if (!coords) return problem(422, 'Coordenadas requeridas', 'Incluye lat_aprox y lng_aprox.');

	const existente = await obtenerEntidad('servicios', key);
	if (existente) return ok(existente, 200, { 'Idempotent-Replayed': 'true' });

	const ahora = new Date().toISOString();
	const item = {
		...elegir(b, CAMPOS),
		...enmascararCoordenadas(coords.lat, coords.lng),
		id: crypto.randomUUID(),
		idempotencyKey: key,
		usuario_id: locals?.usuarioId ?? 'demo',
		es_emprendimiento: b.es_emprendimiento ? 1 : 0,
		activo: 1,
		oculto: 0,
		creado_en: ahora,
		actualizado_en: ahora
	};
	await aplicarEntidadLWW('servicios', item);
	return ok(item, 201);
};
