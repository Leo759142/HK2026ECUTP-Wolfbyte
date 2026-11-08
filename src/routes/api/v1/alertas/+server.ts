import type { RequestHandler } from './$types';
import { ok, problem, requireIdempotency } from '../../_http';
import { store } from '../../_store';
import {
	elegir,
	errorTextos,
	esRespuesta,
	leerCoordenadas,
	leerObjeto,
	validarFoto
} from '../../_validar';
import { enmascararCoordenadas } from '../../../../dominio/tipos/geohash';

const CAMPOS = ['zona_id', 'tipo', 'descripcion', 'foto'] as const;

export const GET: RequestHandler = async ({ url }) => {
	const zona = url.searchParams.get('zona_id');
	return ok({
		items: store.alertas.filter((a) => a.oculto === 0 && (!zona || a.zona_id === zona))
	});
};

export const POST: RequestHandler = async ({ request }) => {
	const key = requireIdempotency(request);
	if (typeof key !== 'string') return key;
	const b = await leerObjeto(request);
	if (esRespuesta(b)) return b;

	const errTexto = errorTextos(b, {
		zona_id: { max: 64 },
		tipo: { max: 40 },
		descripcion: { max: 300 },
		emergencia_id: { max: 64, requerido: false }
	});
	if (errTexto) return problem(422, 'Datos inválidos', errTexto);
	const errFoto = validarFoto(b.foto);
	if (errFoto) return problem(422, 'Foto inválida', errFoto);
	const coords = leerCoordenadas(b, false);
	if (esRespuesta(coords)) return coords;

	const existente = store.alertas.find((a) => a.id === key);
	if (existente) return ok(existente, 200, { 'Idempotent-Replayed': 'true' });

	const ahora = new Date().toISOString();
	const item = {
		...elegir(b, CAMPOS),
		...(coords ? enmascararCoordenadas(coords.lat, coords.lng) : {}),
		id: key,
		emergencia_id: typeof b.emergencia_id === 'string' && b.emergencia_id ? b.emergencia_id : null,
		usuario_id: 'demo',
		estado: 'sin_verificar',
		oculto: 0,
		creado_en: ahora,
		actualizado_en: ahora
	};
	store.alertas.push(item);
	return ok(item, 201);
};
