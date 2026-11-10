import type { RequestHandler } from './$types';
import { ok, problem, requireIdempotency } from '../../_http';
import { leerObjeto, errorTextos, esRespuesta } from '../../_validar';
import { listarEntidad, crearEntidad, obtenerEntidad, aplicarEntidadLWW } from '../_dao-repo';

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

export const GET: RequestHandler = async ({ cookies, url }) => {
	const s = sesionDe(cookies);
	if (!s) return problem(401, 'No autenticado');
	const zona = url.searchParams.get('zona_id');
	const activo = url.searchParams.get('activo');
	const items = await listarEntidad('anuncios', (a) => {
		if (zona && String(a.zona_id) !== zona) return false;
		if (activo !== undefined && String(a.estado) !== activo) return false;
		return true;
	});
	return ok({ items, total: items.length });
};

export const POST: RequestHandler = async ({ cookies, request }) => {
	const s = sesionDe(cookies);
	if (!s) return problem(401, 'No autenticado');
	if (s.rol !== 'admin' && s.rol !== 'emprendedor' && s.rol !== 'anunciante')
		return problem(403, 'Permiso denegado', 'Solo emprendedor/anunciante/admin pueden publicar anuncios (RF21/RF22).');

	const key = requireIdempotency(request);
	if (typeof key !== 'string') return key;
	const b = await leerObjeto(request);
	if (esRespuesta(b)) return b;

	const err = errorTextos(b, { zona_id: { max: 64 }, titulo: { min: 3, max: 100 }, descripcion: { max: 500 } });
	if (err) return problem(422, 'Datos inválidos', err);

	const ahora = new Date().toISOString();
	const fin = b.fin ? new Date(String(b.fin)).toISOString() : null;
	const anuncio = {
		id: key,
		anunciante_id: s.usuarioId,
		zona_id: String(b.zona_id ?? 'z1'),
		titulo: String(b.titulo).trim(),
		descripcion: String(b.descripcion ?? '').trim(),
		etiqueta: 'publicidad',
		estado: 'activo',
		inicio: ahora,
		fin,
		aprobado_por: s.rol === 'admin' ? s.usuarioId : null,
		creado_en: ahora,
		updated_at: ahora
	};
	await crearEntidad('anuncios', anuncio);

	// Notificación de nuevo anuncio a la zona
	await crearEntidad('notificaciones', {
		id: crypto.randomUUID(),
		tipo: 'anuncio',
		usuario_id: null,
		mensaje: `Nuevo anuncio en su zona: ${anuncio.titulo}`,
		leído: 0,
		creado_en: ahora,
		updated_at: ahora
	});

	return ok(anuncio, 201);
};

export const PATCH: RequestHandler = async ({ cookies, params, request }) => {
	const s = sesionDe(cookies);
	if (!s) return problem(401, 'No autenticado');
	const existente = await obtenerEntidad('anuncios', params.id);
	if (!existente) return problem(404, 'Anuncio no encontrado');
	if (existente.anunciante_id !== s.usuarioId && s.rol !== 'admin')
		return problem(403, 'Permiso denegado', 'Solo el anunciante o admin pueden editar este anuncio.');

	const b = await request.json().catch(() => null);
	const cambios: Record<string, unknown> = { id: params.id, updated_at: new Date().toISOString() };
	if (b.estado) cambios.estado = String(b.estado);
	if (b.fin !== undefined) cambios.fin = String(b.fin);
	await aplicarEntidadLWW('anuncios', cambios);
	const anuncio = await obtenerEntidad('anuncios', params.id);
	return ok(anuncio);
};