import type { RequestHandler } from './$types';
import { ok, problem, requireIdempotency } from '../../_http';
import { listarEntidad, crearEntidad, obtenerEntidad, aplicarEntidadLWW } from '../_dao-repo';
import { leerObjeto, esRespuesta, errorTextos } from '../../_validar';
import {
	FUENTES_ALERTA_OFICIAL,
	NIVELES_ALERTA_OFICIAL,
	ESTADOS_ALERTA_OFICIAL,
	type FuenteAlertaOficial,
	type NivelAlertaOficial,
	type EstadoAlertaOficial
} from '../../../../dominio/tipos/tipos';

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

function puedeGestionarAlertas(rol: string): boolean {
	return ['admin', 'coordinador', 'referente'].includes(rol);
}

/** RF16: Alertas oficiales (INDECI / SENAMHI / IGP / Municipio).
 *  Ingestión de alertas desde fuentes oficiales y transición de estado
 *  propuesta → confirmada / descartada por Coordinador o Referente. */
export const GET: RequestHandler = async ({ cookies, url }) => {
	const s = sesionDe(cookies);
	if (!s) return problem(401, 'No autenticado');
	const zona = url.searchParams.get('zona_id');
	const nivel = url.searchParams.get('nivel');
	const estado = url.searchParams.get('estado');
	const items = await listarEntidad('alertas_oficiales', (a) => {
		if (zona && String(a.zona_id) !== zona) return false;
		if (nivel && String(a.nivel) !== nivel) return false;
		if (estado && String(a.estado) !== estado) return false;
		return true;
	});
	return ok({ items, total: items.length, fuente_simulada: true });
};

export const POST: RequestHandler = async ({ cookies, request }) => {
	const s = sesionDe(cookies);
	if (!s) return problem(401, 'No autenticado');
	if (!puedeGestionarAlertas(s.rol))
		return problem(403, 'Permiso denegado', 'Solo entidades autorizadas pueden ingestar alertas oficiales (RF16).');

	const key = requireIdempotency(request);
	if (typeof key !== 'string') return key;

	const b = await leerObjeto(request);
	if (esRespuesta(b)) return b;

	const errTexto = errorTextos(b, {
		titulo: { min: 3, max: 120 },
		detalle: { max: 500 },
		zona_id: { max: 64 },
		id_externo: { max: 128 },
		url_origen: { max: 256 }
	});
	if (errTexto) return problem(422, 'Datos inválidos', errTexto);

	const fuente = String(b.fuente ?? 'otro');
	if (!FUENTES_ALERTA_OFICIAL.includes(fuente as FuenteAlertaOficial))
		return problem(422, 'Fuente inválida', `Fuente debe ser una de: ${FUENTES_ALERTA_OFICIAL.join(', ')}.`);

	const nivel = String(b.nivel ?? 'informativo');
	if (!NIVELES_ALERTA_OFICIAL.includes(nivel as NivelAlertaOficial))
		return problem(422, 'Nivel inválido', `Nivel debe ser uno de: ${NIVELES_ALERTA_OFICIAL.join(', ')}.`);

	const existente = await obtenerEntidad('alertas_oficiales', key);
	if (existente) return ok(existente, 200, { 'Idempotent-Replayed': 'true' });

	const ahora = new Date().toISOString();
	const alerta = {
		id: crypto.randomUUID(),
		idempotencyKey: key,
		fuente,
		id_externo: String(b.id_externo ?? crypto.randomUUID()),
		titulo: String(b.titulo).trim(),
		detalle: String(b.detalle ?? '').trim(),
		nivel,
		zona_id: String(b.zona_id ?? 'z1'),
		url_origen: b.url_origen ? String(b.url_origen) : null,
		estado: 'propuesta' as EstadoAlertaOficial,
		resuelta_por: null,
		resuelta_en: null,
		recibida_en: ahora,
		created_at: ahora,
		updated_at: ahora
	};
	await crearEntidad('alertas_oficiales', alerta);

	await crearEntidad('notificaciones', {
		id: crypto.randomUUID(),
		tipo: 'alerta_oficial',
		usuario_id: null,
		mensaje: `[${alerta.fuente}] ${alerta.titulo}`,
		leído: 0,
		creado_en: ahora,
		updated_at: ahora
	});

	return ok(alerta, 201);
};

export const PATCH: RequestHandler = async ({ cookies, request }) => {
	const s = sesionDe(cookies);
	if (!s) return problem(401, 'No autenticado');
	if (!puedeGestionarAlertas(s.rol))
		return problem(403, 'Permiso denegado', 'Solo coordinador, referente o admin pueden confirmar/descartar alertas oficiales (RF16).');

	const key = requireIdempotency(request);
	if (typeof key !== 'string') return key;

	const b = await leerObjeto(request);
	if (esRespuesta(b)) return b;

	const errTexto = errorTextos(b, {
		id: { max: 128 },
		estado: { max: 20 },
		motivo: { max: 200 }
	});
	if (errTexto) return problem(422, 'Datos inválidos', errTexto);

	const alertaId = String(b.id ?? '');
	if (!alertaId)
		return problem(400, 'ID requerido', 'Incluye el campo "id" en el cuerpo de la petición.');

	const nuevoEstado = String(b.estado ?? '');
	if (!ESTADOS_ALERTA_OFICIAL.includes(nuevoEstado as EstadoAlertaOficial))
		return problem(422, 'Estado inválido', `Estado debe ser uno de: ${ESTADOS_ALERTA_OFICIAL.join(', ')}.`);

	const alerta = await obtenerEntidad<any>('alertas_oficiales', alertaId);
	if (!alerta) return problem(404, 'Alerta no encontrada', `No existe una alerta oficial con id ${alertaId}.`);

	if (alerta.estado !== 'propuesta')
		return problem(
			409,
			'Estado no transitable',
			`La alerta ya está en estado "${alerta.estado}" y solo se puede transitar desde "propuesta".`
		);

	const ahora = new Date().toISOString();
	const actualizada = {
		...alerta,
		estado: nuevoEstado as EstadoAlertaOficial,
		resuelta_por: s.usuarioId,
		resuelta_en: ahora,
		updated_at: ahora
	};
	await aplicarEntidadLWW('alertas_oficiales', actualizada);

	await crearEntidad('notificaciones', {
		id: crypto.randomUUID(),
		tipo: 'alerta_oficial_estado_cambiado',
		usuario_id: s.usuarioId,
		mensaje: `Alerta oficial "${alerta.titulo}" pasada a "${nuevoEstado}" por ${s.usuarioId}`,
		leído: 0,
		creado_en: ahora,
		updated_at: ahora
	});

	return ok(actualizada, 200);
};