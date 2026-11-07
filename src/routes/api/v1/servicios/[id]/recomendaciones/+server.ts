import type { RequestHandler } from './$types';
import { ok, problem, requireIdempotency } from '../../../../_http';

const eventos: Array<Record<string, unknown>> = [];

export const POST = async ({ request, params }) => {
	const key = requireIdempotency(request);
	if (!(typeof key === 'string')) return key;
	const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
	if (!body?.tipo || body.misma_zona === undefined || !body.dispositivo_hash) return problem(422, 'Campos requeridos', 'tipo, misma_zona, dispositivo_hash');
	if (eventos.some((e) => e.id === key)) return ok({ ok: true, replayed: true }, 200, { 'Idempotent-Replayed': 'true' });
	eventos.push({ id: key, servicio_id: params.id, ...body, creado_en: new Date().toISOString() });
	return ok({ ok: true, id: key, servicio_id: params.id }, 201);
};




