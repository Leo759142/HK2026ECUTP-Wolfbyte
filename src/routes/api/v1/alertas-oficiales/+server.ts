import type { RequestHandler } from './$types';
import { ok, problem, requireIdempotency, requireRol } from '../../_http';
import { cargarStore, persistirStore, store } from '../../_store';
import {
	ESTADOS_ALERTA_OFICIAL,
	FUENTES_ALERTA_OFICIAL,
	NIVELES_ALERTA_OFICIAL
} from '../../../../dominio/tipos/tipos';
import { enmascararCoordenadas } from '../../../../dominio/tipos/geohash';
import { elegir, esRespuesta, leerCoordenadas, leerObjeto } from '../../_validar';

const CAMPOS = [
	'zona_id',
	'fuente',
	'external_id',
	'tipo',
	'nivel',
	'titulo',
	'descripcion',
	'publicado_en',
	'vence_en'
] as const;

export const GET: RequestHandler = async ({ url }) => {
	await cargarStore();
	const estado = url.searchParams.get('estado');
	const items = store.alertasOficiales.filter((item) => !estado || item.estado === estado);
	return ok({ items, total: items.length });
};

export const POST: RequestHandler = async ({ request }) => {
	await cargarStore();
	const rol = requireRol(request, 'activar_emergencia');
	if (typeof rol !== 'string') return rol;
	const key = requireIdempotency(request);
	if (typeof key !== 'string') return key;
	const body = await leerObjeto(request);
	if (esRespuesta(body)) return body;

	const error = Object.entries({
		fuente: FUENTES_ALERTA_OFICIAL,
		nivel: NIVELES_ALERTA_OFICIAL
	}).find(([campo, valores]) => !valores.includes(String(body[campo]) as never));
	if (error) return problem(422, `${error[0]} inválido`);
	const texto = ['zona_id', 'titulo', 'descripcion'].find(
		(campo) => typeof body[campo] !== 'string' || !String(body[campo]).trim()
	);
	if (texto) return problem(422, 'Datos inválidos', `${texto} es requerido.`);
	const coords = leerCoordenadas(body, false);
	if (esRespuesta(coords)) return coords;
	const existente = store.alertasOficiales.find((item) => item.id === key);
	if (existente) return ok(existente, 200, { 'Idempotent-Replayed': 'true' });

	const item = {
		...elegir(body, CAMPOS),
		...(coords ? enmascararCoordenadas(coords.lat, coords.lng) : {}),
		id: key,
		estado: 'propuesta',
		ingresada_por: rol,
		creado_en: new Date().toISOString()
	};
	store.alertasOficiales.push(item);
	await persistirStore();
	return ok(item, 201);
};
