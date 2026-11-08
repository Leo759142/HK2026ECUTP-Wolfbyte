import type { RequestHandler } from './$types';
import { ok, problem, requireIdempotency } from '../../_http';
import { store } from '../../_store';
import { elegir, errorTextos, esRespuesta, leerCoordenadas, leerObjeto } from '../../_validar';
import { CATEGORIAS_FAVOR, TIPOS_FAVOR, type CategoriaFavor, type Favor, type TipoFavor } from '../../../../dominio/tipos/tipos';
import { enmascararCoordenadas } from '../../../../dominio/tipos/geohash';

const CAMPOS = ['zona_id', 'tipo', 'categoria', 'titulo', 'descripcion'] as const;
const UBICACION_POR_DEFECTO = { lat_aprox: -12.046, lng_aprox: -77.043 };

export const GET: RequestHandler = async ({ url }) => {
	const zona = url.searchParams.get('zona_id');
	const estado = url.searchParams.get('estado');
	return ok({ items: store.favores.filter((f) => f.oculto === 0 && (!zona || f.zona_id === zona) && (!estado || f.estado === estado)) });
};

export const POST: RequestHandler = async ({ request }) => {
	const key = requireIdempotency(request);
	if (!(typeof key === 'string')) return key;
	const b = await leerObjeto(request);
	if (esRespuesta(b)) return b;

	const errTexto = errorTextos(b, { zona_id: { max: 64 }, titulo: { min: 3, max: 80 }, descripcion: { max: 500 } });
	if (errTexto) return problem(422, 'Datos inválidos', errTexto);
	if (!TIPOS_FAVOR.includes(String(b.tipo) as TipoFavor) || !CATEGORIAS_FAVOR.includes(String(b.categoria) as CategoriaFavor))
		return problem(422, 'Tipo/categoría inválida');
	const coords = leerCoordenadas(b, false);
	if (esRespuesta(coords)) return coords;

	const existente = store.favores.find((f) => f.id === key);
	if (existente) return ok(existente, 200, { 'Idempotent-Replayed': 'true' });

	const aprox = coords ? enmascararCoordenadas(coords.lat, coords.lng) : UBICACION_POR_DEFECTO;
	// Lista blanca primero; los campos que controla el servidor van después y no se pueden sobrescribir.
	const item = {
		...elegir(b, CAMPOS),
		...aprox,
		id: key,
		creador_id: 'demo',
		ayudante_id: null,
		estado: 'abierto',
		oculto: 0,
		agradecimiento: null,
		cerrado_en: null,
		creado_en: new Date().toISOString()
	} as unknown as Favor;
	store.favores.push(item);
	return ok(item, 201);
};
