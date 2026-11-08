import type { RequestHandler } from './$types';
import { ok, problem, requireIdempotency } from '../../_http';
import { store } from '../../_store';
import { elegir, errorTextos, esRespuesta, leerCoordenadas, leerObjeto } from '../../_validar';
import { CATEGORIAS_FAVOR, TIPOS_FAVOR, type CategoriaFavor, type Favor, type TipoFavor } from '../../../../dominio/tipos/tipos';
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

export const GET: RequestHandler = async ({ url }) => {
	const zona = url.searchParams.get('zona_id');
	const estado = url.searchParams.get('estado');
<<<<<<< HEAD
	const limite = url.searchParams.get('limite');
	const offset = url.searchParams.get('offset');
	const paginado = await dao.listarLocalPaginado<Record<string, unknown>>('favores', { limite: limite ? Number(limite) : undefined, offset: offset ? Number(offset) : undefined });
	const filtered = paginado.items.filter((f) => (!zona || f.zona_id === zona) && (!estado || f.estado === estado));
	return ok({ items: filtered, total: paginado.total });
=======
	return ok({ items: store.favores.filter((f) => f.oculto === 0 && (!zona || f.zona_id === zona) && (!estado || f.estado === estado)) });
>>>>>>> deep-backend1/deep-backend1
};

export const POST: RequestHandler = async ({ request }) => {
	const key = requireIdempotency(request);
	if (!(typeof key === 'string')) return key;
<<<<<<< HEAD
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
=======
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
>>>>>>> deep-backend1/deep-backend1
