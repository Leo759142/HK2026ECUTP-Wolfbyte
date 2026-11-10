import type { RequestHandler } from './$types';
import { ok, problem } from '../../_http';

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

/** Panel de administrador (modo administrador). Solo rol 'admin'. */
export const GET: RequestHandler = async ({ cookies, url }) => {
	const s = sesionDe(cookies);
	if (!s) return problem(401, 'No autenticado');
	if (s.rol !== 'admin') return problem(403, 'Permiso denegado', 'Solo administrador puede acceder al panel (modo admin).');

	const seccion = url.searchParams.get('seccion') ?? 'resumen';
	if (seccion === 'resumen') {
		return ok({
			total_usuarios: (await listarEntidad('usuarios')).length,
			usuarios_activos: (await listarEntidad('usuarios', (u) => u.activo === 1)).length,
			total_grupos: (await listarEntidad('grupos')).length,
			total_servicios: (await listarEntidad('servicios')).length,
			total_favores: (await listarEntidad('favores')).length,
			total_alertas: (await listarEntidad('alertas')).length,
			total_emergencias: (await listarEntidad('emergencias')).length,
			total_anuncios: (await listarEntidad('anuncios')).length,
			sesiones_activas: (await listarEntidad('sesiones')).length
		});
	}
	if (seccion === 'usuarios') {
		const rol = url.searchParams.get('rol');
		const items = await listarEntidad('usuarios');
		const mapeados = items.map((u) => ({ id: u.id, celular: u.celular, alias: u.alias, rol: u.rol, activo: u.activo }));
		if (rol) items = items.filter((u) => u.rol === rol);
		return ok({ items, total: items.length });
	}
	if (seccion === 'sesiones') {
		const sesiones = await listarEntidad('sesiones');
		return ok({ sesiones: sesiones.map((s2) => ({ usuarioId: s2.usuarioId, rol: s2.rol, creado_en: s2.creado_en })) });
	}
	return problem(404, 'Sección no encontrada');
};

export const POST: RequestHandler = async ({ cookies, request }) => {
	const s = sesionDe(cookies);
	if (!s) return problem(401, 'No autenticado');
	if (s.rol !== 'admin') return problem(403, 'Permiso denegado', 'Solo administrador (modo admin).');

	const b = await request.json().catch(() => null);
	if (!b || typeof b !== 'object') return problem(400, 'JSON inválido');

	const accion = String(b.accion ?? '');
	if (accion === 'activar_usuario') {
		const u = await obtenerEntidad('usuarios', b.usuario_id);
		if (!u) return problem(404, 'Usuario no encontrado');
		u.activo = 1;
		return ok({ ok: true, mensaje: 'Usuario activado.' });
	}
	if (accion === 'desactivar_usuario') {
		const u = await obtenerEntidad('usuarios', b.usuario_id);
		if (!u) return problem(404, 'Usuario no encontrado');
		u.activo = 0;
		return ok({ ok: true, mensaje: 'Usuario desactivado.' });
	}
	if (accion === 'cambiar_rol') {
		const u = await obtenerEntidad('usuarios', b.usuario_id);
		if (!u) return problem(404, 'Usuario no encontrado');
		u.rol = String(b.rol);
		return ok({ ok: true, mensaje: `Rol cambiado a ${b.rol}.` });
	}
	return problem(422, 'Acción inválida', 'accion: activar_usuario | desactivar_usuario | cambiar_rol');
};