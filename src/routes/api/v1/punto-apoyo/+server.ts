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
	const tipo = url.searchParams.get('tipo');
	const zona = url.searchParams.get('zona_id');
	const items = await listarEntidad('punto_apoyo', (p) => {
		if (tipo && String(p.tipo) !== tipo) return false;
		if (zona && String(p.zona_id) !== zona) return false;
		return true;
	});
	return ok({ items, total: items.length });
};

export const POST: RequestHandler = async ({ cookies, request }) => {
	const s = sesionDe(cookies);
	if (!s) return problem(401, 'No autenticado');
	if (s.rol !== 'admin' && s.rol !== 'referente' && s.rol !== 'coordinador')
		return problem(403, 'Permiso denegado', 'Solo referente, coordinador o admin pueden registrar puntos de apoyo (RF14).');

	const key = requireIdempotency(request);
	if (typeof key !== 'string') return key;
	const b = await leerObjeto(request);
	if (esRespuesta(b)) return b;

	const err = errorTextos(b, { tipo: { max: 32 }, nombre: { min: 3, max: 100 }, zona_id: { max: 64 } });
	if (err) return problem(422, 'Datos inválidos', err);

	const ahora = new Date().toISOString();
	const punto = {
		id: key,
		tipo: String(b.tipo),
		nombre: String(b.nombre).trim(),
		telefono: String(b.telefono ?? ''),
		zona_id: String(b.zona_id ?? 'z1'),
		verificado: 1,
		creado_en: ahora,
		updated_at: ahora
	};
	await crearEntidad('punto_apoyo', punto);
	return ok(punto, 201);
};