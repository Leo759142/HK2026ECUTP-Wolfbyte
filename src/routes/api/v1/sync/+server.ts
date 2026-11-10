import type { RequestHandler } from './$types';
import { ok, problem, requireIdempotency } from '../../_http';
import { dao, outboxDAO } from '../../../../datos/dao';
import { idempotencyStore } from '../../../../lib/db/idempotency';

type Op = { op_id?: string; entidad?: string; operacion?: string; payload?: unknown };

async function aplicar(op: Op) {
	const opId = String(op.op_id ?? '');
	const existente = await idempotencyStore.obtener(opId);
	if (existente) return { op_id: opId, ...(existente.resultado as object), idempotente: true };
	const entidad = String(op.entidad ?? '');
	const payload =
		op.payload && typeof op.payload === 'object' ? (op.payload as Record<string, unknown>) : {};
	const id = String(payload.id ?? op.op_id ?? '');
	if (!entidad || !id)
		return { op_id: op.op_id, resultado: 'rechazada', error: 'entidad/id requerido' };
	const local = await dao.obtenerLocal<Record<string, unknown>>(entidad, id);
	if (local) {
		const r = { op_id: op.op_id, resultado: 'duplicada' };
		await idempotencyStore.guardar(opId, entidad, String(op.operacion ?? 'crear'), r, 200);
		return r;
	}
	await dao.aplicarLocal(entidad, { ...payload, id });
	const r = { op_id: op.op_id, resultado: 'aplicada' };
	await idempotencyStore.guardar(opId, entidad, String(op.operacion ?? 'crear'), r, 201);
	return r;
}

export const POST: RequestHandler = async ({ request }) => {
	const key = requireIdempotency(request);
	if (typeof key !== 'string') return key;

	const b = (await request.json().catch(() => null)) as { operaciones?: Op[] } | null;
	if (!b || !Array.isArray(b.operaciones))
		return problem(
			400,
			'JSON inválido',
			'Se requiere { operaciones: [{ op_id, entidad, operacion, payload }] }'
		);
	const resultados = [] as unknown[];
	for (const op of b.operaciones) {
		const id = String(op?.op_id ?? '');
		if (!id) {
			resultados.push({ op_id: id, resultado: 'rechazada', error: 'op_id requerido' });
			continue;
		}
		const r = await aplicar(op);
		resultados.push(r);
	}
	return ok({ resultados, idempotencyKey: key });
};

export const GET: RequestHandler = async ({ url }) => {
	const cursor = url.searchParams.get('cursor') ?? new Date(0).toISOString();
	const limite = Math.min(Math.max(Number(url.searchParams.get('limite') ?? '50') || 50, 1), 100);
	const { items, total } = await outboxDAO.pendientesPaginado({ limite });
	const cambios = items
		.filter((op) => op.creado_en > cursor)
		.sort((a, b) => a.creado_en.localeCompare(b.creado_en))
		.slice(0, limite);
	const siguiente = cambios.length ? cambios[cambios.length - 1].creado_en : null;
	const progreso = total > 0 ? Math.round((cambios.length / total) * 100) : 100;
	return ok({ tablas: ['outbox'], siguiente, progreso, cambios });
};
