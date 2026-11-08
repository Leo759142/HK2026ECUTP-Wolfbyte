import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { problem } from '../../_http';

type Op = { op_id?: string; entidad?: string; operacion?: string; payload?: unknown };
const idem = new Map<string, { status: number; body: unknown }>();
const store = new Map<string, Map<string, Record<string, unknown>>>();

function tabla(entidad: string) {
	if (!store.has(entidad)) store.set(entidad, new Map());
	return store.get(entidad)!;
}

async function aplicar(op: Op) {
	const entidad = String(op.entidad ?? '');
	const payload = (op.payload && typeof op.payload === 'object' ? (op.payload as Record<string, unknown>) : {});
	const id = String(payload.id ?? op.op_id ?? '');
	if (!entidad || !id) return { op_id: op.op_id, resultado: 'rechazada', error: 'entidad/id requerido' };
	tabla(entidad).set(id, { ...payload, id });
	return { op_id: op.op_id, resultado: 'aplicada' };
}

export const POST: RequestHandler = async ({ request }) => {
	const b = (await request.json().catch(() => null)) as { operaciones?: Op[] } | null;
	if (!b || !Array.isArray(b.operaciones)) return problem(400, 'JSON inválido', 'Se requiere { operaciones: [{ op_id, entidad, operacion, payload }] }');
	const resultados = [] as unknown[];
	for (const op of b.operaciones) {
		const id = String(op?.op_id ?? '');
		if (!id) { resultados.push({ op_id: id, resultado: 'rechazada', error: 'op_id requerido' }); continue; }
		if (idem.has(id)) { resultados.push({ op_id: id, resultado: 'duplicada' }); continue; }
		const r = await aplicar(op);
		idem.set(id, { status: 200, body: r });
		resultados.push(r);
	}
	return json({ resultados });
};

export const GET: RequestHandler = async ({ url }) => json({ cursor: url.searchParams.get('cursor') ?? new Date(0).toISOString(), nextCursor: new Date().toISOString(), cambios: [] });
