import type { RequestHandler } from './$types';
import { ok, problem } from '../../_http';
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

/** RF16: Alertas oficiales (INDECI / SENAMHI). En esta versión se simula la ingesta
 *  de una fuente oficial; en producción se conectaría al API real de cada institución. */
export const GET: RequestHandler = async ({ cookies, url }) => {
	const s = sesionDe(cookies);
	if (!s) return problem(401, 'No autenticado');
	const zona = url.searchParams.get('zona_id');
	const nivel = url.searchParams.get('nivel');
	const items = await listarEntidad('alertas_oficiales', (a) => {
		if (zona && String(a.zona_id) !== zona) return false;
		if (nivel && String(a.nivel) !== nivel) return false;
		return true;
	});
	return ok({ items, total: items.length, fuente_simulada: true });
};

export const POST: RequestHandler = async ({ cookies, request }) => {
	const s = sesionDe(cookies);
	if (!s) return problem(401, 'No autenticado');
	if (s.rol !== 'admin' && s.rol !== 'coordinador' && s.rol !== 'referente')
		return problem(403, 'Permiso denegado', 'Solo entidades autorizadas pueden ingestar alertas oficiales (RF16).');

	const b = await request.json().catch(() => null);
	if (!b || typeof b !== 'object') return problem(400, 'JSON inválido');

	const ahora = new Date().toISOString();
	const alerta = {
		id: crypto.randomUUID(),
		fuente: String(b.fuente ?? 'SIMULADO'),
		id_externo: String(b.id_externo ?? crypto.randomUUID()),
		titulo: String(b.titulo ?? 'Alerta oficial'),
		detalle: String(b.detalle ?? ''),
		nivel: String(b.nivel ?? 'informativo'),
		zona_id: String(b.zona_id ?? 'z1'),
		url_origen: String(b.url_origen ?? null),
		estado: 'activa',
		recibida_en: ahora,
		created_at: ahora,
		updated_at: ahora
	};
	await crearEntidad('alertas_oficiales', alerta);

	// Notificar a todos los usuarios de la zona
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