import type { RequestHandler } from './$types';
import { ok, problem } from '../../_http';
import { obtenerEntidad, aplicarEntidadLWW, crearEntidad, listarEntidad } from '../_dao-repo';

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

export const POST: RequestHandler = async ({ cookies, request }) => {
	const s = sesionDe(cookies);
	if (!s) return problem(401, 'No autenticado');
	if (s.rol !== 'admin' && s.rol !== 'referente' && s.rol !== 'coordinador')
		return problem(403, 'Permiso denegado', 'Solo referente, coordinador o admin pueden moderar (RF04).');

	const b = await request.json().catch(() => null);
	if (!b || typeof b !== 'object') return problem(400, 'JSON inválido');

	const accion = String(b.accion ?? '');
	const ahora = new Date().toISOString();

	if (accion === 'ocultar_servicio') {
		const svc = await obtenerEntidad('servicios', b.objeto_id);
		if (!svc) return problem(404, 'Servicio no encontrado');
		await aplicarEntidadLWW('servicios', { id: svc.id, oculto: 1, updated_at: ahora });
		await crearEntidad('notificaciones', {
			id: crypto.randomUUID(),
			tipo: 'moderacion',
			usuario_id: svc.usuario_id,
			mensaje: 'Su servicio fue ocultado por un referente.',
			leído: 0,
			creado_en: ahora,
			updated_at: ahora
		});
		return ok({ ok: true, mensaje: 'Servicio ocultado por moderación.' });
	}
	if (accion === 'ocultar_favor') {
		const fav = await obtenerEntidad('favores', b.objeto_id);
		if (!fav) return problem(404, 'Favor no encontrado');
		await aplicarEntidadLWW('favores', { id: fav.id, oculto: 1, updated_at: ahora });
		await crearEntidad('notificaciones', {
			id: crypto.randomUUID(),
			tipo: 'moderacion',
			usuario_id: fav.creador_id,
			mensaje: 'Su favor fue ocultado por un referente.',
			leído: 0,
			creado_en: ahora,
			updated_at: ahora
		});
		return ok({ ok: true, mensaje: 'Favor ocultado por moderación.' });
	}
	if (accion === 'aprobar_ingreso') {
		return ok({ ok: true, mensaje: 'Use POST /grupos/:id/membresias con accion aprobar.' });
	}
	return problem(422, 'Acción inválida', 'accion: ocultar_servicio | ocultar_favor');
};

export const GET: RequestHandler = async ({ cookies }) => {
	const s = sesionDe(cookies);
	if (!s) return problem(401, 'No autenticado');
	if (s.rol !== 'admin' && s.rol !== 'referente' && s.rol !== 'coordinador')
		return problem(403, 'Permiso denegado');

	const ocultosServicios = (await listarEntidad('servicios', (s) => s.oculto === 1)).map((s) => ({ id: s.id, titulo: s.titulo, oculto: s.oculto }));
	const ocultosFavores = (await listarEntidad('favores', (f) => f.oculto === 1)).map((f) => ({ id: f.id, titulo: f.titulo, oculto: f.oculto }));
	return ok({ servicios_ocultos: ocultosServicios, favores_ocultos: ocultosFavores });
};