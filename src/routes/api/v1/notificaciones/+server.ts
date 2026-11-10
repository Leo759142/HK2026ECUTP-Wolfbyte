import type { RequestHandler } from './$types';
import { ok, problem } from '../../_http';
import { listarEntidad, obtenerEntidad, aplicarEntidadLWW } from '../_dao-repo';

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
	const soloNoLeidos = url.searchParams.get('no_leidos') === '1';
	const items = await listarEntidad('notificaciones', (n) => {
		return n.usuario_id === null || n.usuario_id === s.usuarioId;
	});
	const mapeados = items.map((n) => ({ id: n.id, tipo: n.tipo, mensaje: n.mensaje, leído: n.leído, creado_en: String(n.creado_en) }))
		.sort((a, b) => (b.creado_en ?? '').localeCompare(a.creado_en ?? ''));
	const filtrados = soloNoLeidos ? mapeados.filter((n) => !n.leído) : mapeados;
	return ok({ items: filtrados, total: filtrados.length, no_leidos: filtrados.filter((n) => !n.leído).length });
};

export const PATCH: RequestHandler = async ({ cookies, params, request }) => {
	const s = sesionDe(cookies);
	if (!s) return problem(401, 'No autenticado');
	const existente = await obtenerEntidad('notificaciones', params.id);
	if (!existente) return problem(404, 'Notificación no encontrada');
	if (existente.usuario_id !== null && existente.usuario_id !== s.usuarioId)
		return problem(403, 'Permiso denegado');

	const b = await request.json().catch(() => null);
	const cambios: Record<string, unknown> = { id: params.id, updated_at: new Date().toISOString() };
	if (b.leído !== undefined) cambios.leído = b.leído === true || b.leído === 1 ? 1 : 0;
	await aplicarEntidadLWW('notificaciones', cambios);
	const notif = await obtenerEntidad('notificaciones', params.id);
	return ok(notif);
};