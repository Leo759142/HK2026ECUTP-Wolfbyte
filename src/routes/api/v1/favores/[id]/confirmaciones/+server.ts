import type { RequestHandler } from './$types';
import { ok, problem, requireIdempotency } from '../../../../_http';
import { store } from '../../../../_store';
import {
	METODOS_CONFIRMACION,
	ROLES_EN_FAVOR,
	type FavorConfirmacion,
	type MetodoConfirmacion,
	type RolEnFavor
} from '../../../../../../dominio/tipos/tipos';
import { ServicioCierreFavor } from '../../../../../../dominio/favores/cierre';

export const POST: RequestHandler = async ({ request, params }) => {
	const key = requireIdempotency(request);
	if (typeof key !== 'string') return key;

	const previa = store.confirmaciones.find((c) => c.id === key);
	if (previa) {
		const favor = store.favores.find((item) => item.id === previa.favor_id);
		return ok({ ok: true, replayed: true, id: key, favor_estado: favor?.estado }, 200, {
			'Idempotent-Replayed': 'true'
		});
	}

	const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
	if (!body || typeof body !== 'object' || Array.isArray(body))
		return problem(400, 'JSON inválido', 'El cuerpo debe ser un objeto JSON.');

	const favor = store.favores.find((item) => item.id === params.id && item.oculto === 0);
	if (!favor) return problem(404, 'Favor no encontrado', `No existe el favor ${params.id}.`);

	const rol = String(body.rol_en_favor ?? '');
	const metodo = String(body.metodo ?? '');
	const usuarioId = typeof body.usuario_id === 'string' ? body.usuario_id.trim() : '';
	if (!ROLES_EN_FAVOR.includes(rol as RolEnFavor))
		return problem(422, 'Rol inválido', `rol_en_favor debe ser: ${ROLES_EN_FAVOR.join(', ')}.`);
	if (!METODOS_CONFIRMACION.includes(metodo as MetodoConfirmacion))
		return problem(422, 'Método inválido', `metodo debe ser: ${METODOS_CONFIRMACION.join(', ')}.`);
	if (!usuarioId) return problem(422, 'usuario_id requerido', 'Indica quién confirma.');

	if (favor.estado === 'cerrado')
		return problem(409, 'Favor ya cerrado', 'Este favor ya fue confirmado por ambas partes.');
	if (favor.estado !== 'en_curso' || !favor.ayudante_id)
		return problem(
			409,
			'Favor sin ayudante',
			'Solo se confirma un favor en curso con ayudante asignado.'
		);

	const esperado = rol === 'solicitante' ? favor.creador_id : favor.ayudante_id;
	if (usuarioId !== esperado)
		return problem(403, 'No corresponde', `El usuario ${usuarioId} no es el ${rol} de este favor.`);

	const yaConfirmo = store.confirmaciones.some(
		(item) =>
			item.favor_id === favor.id && item.usuario_id === usuarioId && item.rol_en_favor === rol
	);
	if (!yaConfirmo) {
		const confirmacion: FavorConfirmacion = {
			id: key,
			favor_id: favor.id,
			usuario_id: usuarioId,
			rol_en_favor: rol as RolEnFavor,
			metodo: metodo as MetodoConfirmacion,
			confirmado_en: new Date().toISOString()
		};
		store.confirmaciones.push(confirmacion);
	}

	if (
		ServicioCierreFavor.evaluarCierreMutuo(
			favor.id,
			favor.creador_id,
			favor.ayudante_id,
			store.confirmaciones
		)
	) {
		favor.estado = 'cerrado';
		favor.cerrado_en = new Date().toISOString();
	}
	return ok({ ok: true, id: key, favor_estado: favor.estado }, 201);
};
