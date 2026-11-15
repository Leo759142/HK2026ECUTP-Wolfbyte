import type { RequestHandler } from './$types';
import { ok, problem, requireRol } from '../../../_http';
import { cargarStore, persistirStore, store } from '../../../_store';
import { ESTADOS_ALERTA_OFICIAL } from '../../../../../dominio/tipos/tipos';

export const PATCH: RequestHandler = async ({ request, params }) => {
	await cargarStore();
	const rol = requireRol(request, 'activar_emergencia');
	if (typeof rol !== 'string') return rol;
	const body = (await request.json().catch(() => null)) as { estado?: string } | null;
	if (!body || !ESTADOS_ALERTA_OFICIAL.includes(body.estado as never))
		return problem(422, 'Estado inválido', 'Usa propuesta, confirmada o descartada.');
	const item = store.alertasOficiales.find((alerta) => alerta.id === params.id);
	if (!item) return problem(404, 'Alerta no encontrada');
	item.estado = body.estado;
	item.revisada_por = rol;
	item.revisada_en = new Date().toISOString();
	await persistirStore();
	return ok(item);
};
