import type { RequestHandler } from './$types';
import { ok, problem } from '../../../_http';
import {
	listarEntidad,
	obtenerEntidad,
	aplicarEntidadLWW,
	crearEntidad,
	eliminarEntidad
} from '../../../_dao-repo';

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
	if (s.rol !== 'admin') return problem(403, 'Permiso denegado');

	const nombre = String(params.entidad);
	const filas = await listarEntidad(nombre);
	return ok({ entidad: nombre, total: filas.length, items: filas });
};

export const POST: RequestHandler = async ({ cookies, params, request }) => {
	const s = sesionDe(cookies);
	if (!s) return problem(401, 'No autenticado');
	if (s.rol !== 'admin') return problem(403, 'Permiso denegado');

	const nombre = String(params.entidad);
	const b = await request.json().catch(() => null);
	if (!b || typeof b !== 'object') return problem(400, 'JSON inválido');

	const accion = String(b.accion ?? 'crear');

	if (accion === 'crear') {
		const id = await crearEntidad(nombre, b);
		return ok({ ok: true, id, mensaje: 'Registro creado.' }, 201);
	}

	if (accion === 'actualizar') {
		const id = String(b.id ?? '');
		if (!id) return problem(400, 'Falta id');
		const existente = await obtenerEntidad(nombre, id);
		if (!existente) return problem(404, 'Registro no encontrado');
		await aplicarEntidadLWW(nombre, { ...existente, ...b, id, updated_at: new Date().toISOString() });
		return ok({ ok: true, id, mensaje: 'Registro actualizado.' });
	}

	if (accion === 'eliminar') {
		const id = String(b.id ?? '');
		if (!id) return problem(400, 'Falta id');
		await eliminarEntidad(nombre, id);
		return ok({ ok: true, id, mensaje: 'Registro eliminado.' });
	}

	return problem(422, 'Acción inválida', 'accion: crear | actualizar | eliminar');
};