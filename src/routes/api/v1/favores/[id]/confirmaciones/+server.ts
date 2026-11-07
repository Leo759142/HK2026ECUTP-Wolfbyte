import { ok, problem, requireIdempotency } from '../../../../_http';
import { memoria as favores } from '../../+server';

const confs: Array<Record<string, unknown>> = [];
export const POST = async ({ request, params }) => {
	const key = requireIdempotency(request);
	if (!(typeof key === 'string')) return key;
	const b = (await request.json().catch(() => null)) as Record<string, unknown> | null;
	if (!b?.rol_en_favor || !b?.metodo) return problem(422, 'rol_en_favor y metodo requeridos');
	if (confs.some((c) => c.id === key)) return ok({ ok: true, replayed: true }, 200, { 'Idempotent-Replayed': 'true' });
	const conf = { id: key, favor_id: params.id, usuario_id: String(b.usuario_id ?? 'demo'), ...b, confirmado_en: new Date().toISOString() };
	confs.push(conf);
	const favor = favores.find((f) => f.id === params.id) as any;
	if (favor?.ayudante_id && favor?.creador_id) {
		const delFavor = confs.filter((c) => c.favor_id === params.id);
		const okSol = delFavor.some((c) => c.usuario_id === favor.creador_id && c.rol_en_favor === 'solicitante');
		const okAyu = delFavor.some((c) => c.usuario_id === favor.ayudante_id && c.rol_en_favor === 'ayudante');
		if (okSol && okAyu) {
			favor.estado = 'cerrado';
			favor.cerrado_en = new Date().toISOString();
		}
	}
	return ok({ ok: true, id: key, favor_estado: (favores.find((f) => f.id === params.id) as any)?.estado }, 201);
};
