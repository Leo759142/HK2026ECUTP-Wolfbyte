import type { RequestHandler } from './$types';
import { ok, problem, requireIdempotency } from '../../_http';
import { leerObjeto, errorTextos, esRespuesta } from '../../_validar';
import { listarEntidad, crearEntidad } from '../_dao-repo';

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
	const items = await listarEntidad('grupos', (g) => {
		if (zona && String(g.zona_id) !== zona) return false;
		if (activo !== undefined && String(g.activo) !== activo) return false;
		return true;
	});
	const mapeados = items.map((g) => ({ id: g.id, nombre: g.nombre, zona_id: g.zona_id, tipo: g.tipo, activo: g.activo, creador_id: g.creador_id }));
	return ok({ items: mapeados, total: mapeados.length });
};

export const POST: RequestHandler = async ({ cookies, request, url }) => {
	const s = sesionDe(cookies);
	if (!s) return problem(401, 'No autenticado', 'Inicie sesión para crear un grupo.');
	if (s.rol !== 'referente' && s.rol !== 'admin' && s.rol !== 'coordinador')
		return problem(403, 'Permiso denegado', 'Solo referente, coordinador o admin pueden crear grupos.');

	const key = requireIdempotency(request);
	if (typeof key !== 'string') return key;
	const b = await leerObjeto(request);
	if (esRespuesta(b)) return b;

	const err = errorTextos(b, { nombre: { min: 3, max: 100 }, zona_id: { max: 64 }, tipo: { max: 32 } });
	if (err) return problem(422, 'Datos inválidos', err);

	const ahora = new Date().toISOString();
	const grupo = {
		id: key,
		nombre: String(b.nombre).trim(),
		zona_id: String(b.zona_id ?? 'z1'),
		tipo: String(b.tipo ?? 'manzana'),
		creador_id: s.usuarioId,
		activo: 1,
		creado_en: ahora,
		updated_at: ahora
	};
	await crearEntidad('grupos', grupo);
	return ok(grupo, 201);
};