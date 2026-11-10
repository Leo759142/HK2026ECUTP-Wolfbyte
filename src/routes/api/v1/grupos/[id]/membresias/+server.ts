import type { RequestHandler } from './$types';
import { ok, problem } from '../../../_http';
import { listarEntidad, crearEntidad, obtenerEntidad, aplicarEntidadLWW, eliminarEntidad } from '../../../_dao-repo';

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

export const GET: RequestHandler = async ({ cookies, params, url }) => {
	const s = sesionDe(cookies);
	if (!s) return problem(401, 'No autenticado');
	const grupoId = params.id;
	const estado = url.searchParams.get('estado');
	const items = await listarEntidad('membresias', (m) => {
		if (String(m.grupo_id) !== grupoId) return false;
		if (estado && String(m.estado) !== estado) return false;
		return true;
	});
	return ok({ items, total: items.length });
};

export const POST: RequestHandler = async ({ cookies, params, request }) => {
	const s = sesionDe(cookies);
	if (!s) return problem(401, 'No autenticado', 'Inicie sesión para unirse a un grupo.');
	const grupoId = params.id;

	const grupo = await obtenerEntidad('grupos', grupoId);
	if (!grupo) return problem(404, 'Grupo no encontrado');

	const yaMiembro = (await listarEntidad('membresias', (m) => {
		return String(m.grupo_id) === grupoId && String(m.usuario_id) === s.usuarioId;
	})).length > 0;
	if (yaMiembro) return problem(409, 'Ya es miembro', 'Ya pertenece a este grupo.');

	const ahora = new Date().toISOString();
	// Si el solicitante es referente/admin, se aprueba directo; si no, queda pendiente hasta que el referente apruebe (RF04)
	const rolSolicitante = s.rol === 'admin' || s.rol === 'referente' ? 'referente' : 'vecino';
	const estadoInicial = s.rol === 'admin' || s.rol === 'referente' ? 'activa' : 'pendiente';

	const membresia = {
		id: crypto.randomUUID(),
		usuario_id: s.usuarioId,
		grupo_id: grupoId,
		rol: rolSolicitante,
		estado: estadoInicial,
		creado_en: ahora,
		updated_at: ahora
	};
	await crearEntidad('membresias', membresia);

	return ok(
		{ membresia, mensaje: estadoInicial === 'activa' ? 'Ingreso aprobado' : 'Solicitud enviada, a la espera de aprobación del referente' },
		201
	);
};

export const PATCH: RequestHandler = async ({ cookies, params, request }) => {
	const s = sesionDe(cookies);
	if (!s) return problem(401, 'No autenticado');
	if (s.rol !== 'admin' && s.rol !== 'referente')
		return problem(403, 'Permiso denegado', 'Solo referente o admin pueden aprobar/rechazar miembros.');

	const grupoId = params.id;
	const cuerpo = await request.json().catch(() => null);
	if (!cuerpo || typeof cuerpo !== 'object') return problem(400, 'JSON inválido');

	const membresia = await obtenerEntidad('membresias', cuerpo.membresia_id);
	if (!membresia || String(membresia.grupo_id) !== grupoId) return problem(404, 'Membresía no encontrada');

	const accion = String(cuerpo.accion ?? '');
	if (accion === 'aprobar') {
		await aplicarEntidadLWW('membresias', { id: membresia.id, grupo_id: membresia.grupo_id, usuario_id: membresia.usuario_id, rol: membresia.rol, estado: 'activa', updated_at: new Date().toISOString() });
		const actualizada = await obtenerEntidad('membresias', membresia.id);
		return ok({ membresia: actualizada, mensaje: 'Ingreso aprobado (RF04)' });
	}
	if (accion === 'rechazar') {
		await eliminarEntidad('membresias', membresia.id);
		return ok({ mensaje: 'Solicitud rechazada' });
	}
	if (accion === 'suspender') {
		await aplicarEntidadLWW('membresias', { id: membresia.id, grupo_id: membresia.grupo_id, usuario_id: membresia.usuario_id, rol: membresia.rol, estado: 'suspendida', updated_at: new Date().toISOString() });
		const actualizada = await obtenerEntidad('membresias', membresia.id);
		return ok({ membresia: actualizada, mensaje: 'Miembro suspendido' });
	}
	return problem(422, 'Acción inválida', 'accion debe ser: aprobar, rechazar o suspender.');
};