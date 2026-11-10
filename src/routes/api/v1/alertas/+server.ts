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

function sesionDe(cookies: any): { usuarioId: string; rol: string } | null {
	const raw = cookies.get('pod_sesion');
	if (!raw) return null;
	try {
		const p = JSON.parse(decodeURIComponent(raw)) as { usuarioId: string; rol: string; exp: number };
		if (p.exp && Date.now() > p.exp) return null;
		return { usuarioId: p.usuarioId, rol: p.rol };
	} catch {
		return null;
	}
}

/** RF13: Reportar necesidad en emergencia (tipo, urgencia, ubicación aproximada). */
export const POST: RequestHandler = async ({ cookies, request }) => {
	const s = sesionDe(cookies);
	if (!s) return problem(401, 'No autenticado', 'Inicie sesión para reportar.');

	const key = requireIdempotency(request);
	if (typeof key !== 'string') return key;
	const b = await leerObjeto(request);
	if (esRespuesta(b)) return b;

	const errTexto = errorTextos(b, {
		zona_id: { max: 64 },
		tipo: { max: 40 },
		descripcion: { min: 3, max: 300 },
		emergencia_id: { max: 64, requerido: false }
	});
	if (errTexto) return problem(422, 'Datos inválidos', errTexto);
	const errFoto = validarFoto(b.foto);
	if (errFoto) return problem(422, 'Foto inválida', errFoto);
	const coords = leerCoordenadas(b, true);
	if (esRespuesta(coords)) return coords;
	if (!coords) return problem(422, 'Coordenadas requeridas', 'Incluye lat_aprox y lng_aprox.');

	const existente = store.alertas.find((a) => a.idempotencyKey === key);
	if (existente) return ok(existente, 200, { 'Idempotent-Replayed': 'true' });

	const ahora = new Date().toISOString();
	const ubic = enmascararCoordenadas(coords.lat, coords.lng);
	const item = {
		...elegir(b, CAMPOS),
		...ubic,
		id: key,
		idempotencyKey: key,
		emergencia_id: typeof b.emergencia_id === 'string' && b.emergencia_id ? b.emergencia_id : null,
		usuario_id: s.usuarioId,
		estado: 'sin_verificar',
		oculto: 0,
		creado_en: ahora,
		actualizado_en: ahora
	};
	store.alertas.push(item);

	store.notificaciones.push({
		id: crypto.randomUUID(),
		tipo: 'alerta',
		usuario_id: null,
		mensaje: `Nueva necesidad reportada: ${String(b.tipo)} (${String(b.descripcion)})`,
		leído: 0,
		creado_en: ahora
	});

	return ok(item, 201);
};

export const GET: RequestHandler = async ({ cookies, url }) => {
	const s = sesionDe(cookies);
	if (!s) return problem(401, 'No autenticado');
	const zona = url.searchParams.get('zona_id');
	const estado = url.searchParams.get('estado');
	let items = store.alertas.map((a) => ({
		id: a.id,
		tipo: a.tipo,
		descripcion: a.descripcion,
		estado: a.estado,
		zona_id: a.zona_id,
		lat_aprox: a.lat_aprox,
		lng_aprox: a.lng_aprox,
		creado_en: a.creado_en
	}));
	if (zona) items = items.filter((a) => a.zona_id === zona);
	if (estado) items = items.filter((a) => a.estado === estado);
	return ok({ items, total: items.length });
};
