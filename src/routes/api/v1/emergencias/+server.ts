import { ok, problem, requireIdempotency, requireRol } from '../../_http';

const emergencias: Array<Record<string, unknown>> = [];
export const POST = async ({ request }) => {
	const rol = requireRol(request, 'activar_emergencia');
	if (!(typeof rol === 'string')) return rol;
	const key = requireIdempotency(request);
	if (!(typeof key === 'string')) return key;
	const b = (await request.json().catch(() => null)) as Record<string, unknown> | null;
	if (!b || typeof b !== 'object' || Array.isArray(b) || !b.zona_id || !b.tipo || !b.titulo)
		return problem(422, 'Campos requeridos', 'zona_id, tipo, titulo');
	if (emergencias.some((e) => e.id === key)) return ok(emergencias.find((e) => e.id === key), 200, { 'Idempotent-Replayed': 'true' });
	const item = { id: key, activa: 1, activada_por: rol, inicio: new Date().toISOString(), fin: null, ...b };
	emergencias.push(item);
	return ok(item, 201);
};


