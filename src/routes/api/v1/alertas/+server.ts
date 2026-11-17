import type { RequestHandler } from './$types';
import { ok, problem, requireIdempotency, requireRol } from '../../_http';
import { cargarStore, persistirStore, store } from '../../_store';
import {
	elegir,
	errorTextos,
	esRespuesta,
	leerCoordenadas,
	leerObjeto,
	validarFoto,
	validarFotos
} from '../../_validar';
import { enmascararCoordenadas } from '../../../../dominio/tipos/geohash';

const CAMPOS = ['zona_id', 'tipo', 'descripcion', 'foto', 'fotos'] as const;

export const GET: RequestHandler = async ({ url, cookies }) => {
	const sesion = JSON.parse(cookies.get('pod_sesion') || '{}');
	await cargarStore();
	const zona = url.searchParams.get('zona_id');
	const items = store.alertas
		.filter((a) => a.oculto === 0 && (!zona || a.zona_id === zona))
		.map((a) => (sesion.usuarioId ? { ...a, usuario_id: sesion.usuarioId, rol: sesion.rol } : a));
	return ok({ items });
};

export const POST: RequestHandler = async ({ request, cookies }) => {
	const sesion = JSON.parse(cookies.get('pod_sesion') || '{}');
	if (!sesion.usuarioId) return problem(401, 'Sesión no válida');

	await cargarStore();
	const rol = requireRol(request, 'reportar_emergencia');
	if (typeof rol !== 'string') return rol;
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
	const errFotos = validarFotos(b.fotos);
	if (errFotos) return problem(422, 'Fotos inválidas', errFotos);
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
		usuario_id: sesion.usuarioId,
		rol: sesion.rol,
		estado: 'sin_verificar',
		oculto: 0,
		creado_en: ahora,
		actualizado_en: ahora
	};
	store.alertas.push(item);
	await persistirStore();
	return ok(item, 201);
};