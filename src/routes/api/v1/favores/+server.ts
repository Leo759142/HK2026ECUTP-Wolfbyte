import type { RequestHandler } from './';
import { ok, problem, requireIdempotency } from '../../_http';
import { leerObjeto, errorTextos, esRespuesta, leerCoordenadas, elegir, validarFoto } from '../../_validar';
import { listarEntidad, obtenerEntidad, aplicarEntidadLWW } from '../_dao-repo';
import { CATEGORIAS_FAVOR, TIPOS_FAVOR, type CategoriaFavor, type TipoFavor } from '../../../../dominio/tipos/tipos';
import { enmascararCoordenadas } from '../../../../dominio/tipos/geohash';

const CAMPOS = [ 'zona_id', 'tipo', 'categoria', 'titulo', 'descripcion', 'foto' ] as const;
const UBICACION_POR_DEFECTO = { lat_aprox: -12.046, lng_aprox: -77.043 };

export const GET: RequestHandler = async ({ url }) => {
	const zona = url.searchParams.get('zona_id');
	const estado = url.searchParams.get('estado');
	const items = await listarEntidad('favores', (f) => {
		if (f.oculto === 1) return false;
		if (zona && String(f.zona_id) !== zona) return false;
		if (estado && String(f.estado) !== estado) return false;
		return true;
	});
	return ok({ items, total: items.length });
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
	if (
		!TIPOS_FAVOR.includes(String(b.tipo) as TipoFavor) ||
		!CATEGORIAS_FAVOR.includes(String(b.categoria) as CategoriaFavor)
	)
		return problem(422, 'Tipo/categoría inválida');
	const coords = leerCoordenadas(b, false);
	if (esRespuesta(coords)) return coords;

	const existente = await obtenerEntidad('favores', key);
	if (existente) return ok(existente, 200, { 'Idempotent-Replayed': 'true' });

	const aprox = coords ? enmascararCoordenadas(coords.lat, coords.lng) : UBICACION_POR_DEFECTO;
	const id = crypto.randomUUID();
	const item = {
		...elegir(b, CAMPOS),
		...aprox,
		id,
		idempotencyKey: key,
		creador_id: locals?.usuarioId ?? 'demo',
		ayudante_id: null,
		estado: 'abierto',
		oculto: 0,
		agradecimiento: null,
		cerrado_en: null,
		creado_en: new Date().toISOString()
	} as unknown as Favor;
	await aplicarEntidadLWW('favores', item);
	return ok(item, 201);
};
