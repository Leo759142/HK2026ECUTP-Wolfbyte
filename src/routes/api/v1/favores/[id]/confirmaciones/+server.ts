import type { RequestHandler } from './$types';
import { ok, problem, requireIdempotency } from '../../../../_http';
import { store } from '../../../../_store';
import { METODOS_CONFIRMACION, ROLES_EN_FAVOR, type FavorConfirmacion, type MetodoConfirmacion, type RolEnFavor } from '../../../../../../dominio/tipos/tipos';
import { ServicioCierreFavor } from '../../../../../../dominio/favores/cierre';

/**
 * RF11 · Cierre mutuo "Se cumplió" (append-only).
 * Nota demo: sin sesión real, el usuario llega en el body; se valida que coincida con el rol en el favor.
 */
export const POST: RequestHandler = async ({ request, params }) => {
	const key = requireIdempotency(request);
	if (!(typeof key === 'string')) return key;

	const previa = store.confirmaciones.find((c) => c.id === key);
	if (previa) {
		const f = store.favores.find((x) => x.id === previa.favor_id);
		return ok({ ok: true, replayed: true, id: key, favor_estado: f?.estado }, 200, { 'Idempotent-Replayed': 'true' });
	}

	const b = (await request.json().catch(() => null)) as Record<string, unknown> | null;
	if (!b || typeof b !== 'object' || Array.isArray(b)) return problem(400, 'JSON inválido', 'El cuerpo debe ser un objeto JSON.');

	const favor = store.favores.find((f) => f.id === params.id && f.oculto === 0);
	if (!favor) return problem(404, 'Favor no encontrado', `No existe el favor ${params.id}.`);

	const rol = String(b.rol_en_favor ?? '');
	const metodo = String(b.metodo ?? '');
	const usuarioId = typeof b.usuario_id === 'string' ? b.usuario_id.trim() : '';
	if (!ROLES_EN_FAVOR.includes(rol as RolEnFavor)) return problem(422, 'Rol inválido', `rol_en_favor debe ser: ${ROLES_EN_FAVOR.join(', ')}.`);
	if (!METODOS_CONFIRMACION.includes(metodo as MetodoConfirmacion)) return problem(422, 'Método inválido', `metodo debe ser: ${METODOS_CONFIRMACION.join(', ')}.`);
	if (!usuarioId) return problem(422, 'usuario_id requerido', 'Indica quién confirma.');

	if (favor.estado === 'cerrado') return problem(409, 'Favor ya cerrado', 'Este favor ya fue confirmado por ambas partes.');
	if (favor.estado !== 'en_curso' || !favor.ayudante_id) return problem(409, 'Favor sin ayudante', 'Solo se confirma un favor en curso con ayudante asignado.');

	const esperado = rol === 'solicitante' ? favor.creador_id : favor.ayudante_id;
	if (usuarioId !== esperado) return problem(403, 'No corresponde', `El usuario ${usuarioId} no es el ${rol} de este favor.`);

	const yaConfirmo = store.confirmaciones.some((c) => c.favor_id === favor.id && c.usuario_id === usuarioId && c.rol_en_favor === rol);
	if (!yaConfirmo) {
		const conf: FavorConfirmacion = {
			id: key,
			favor_id: favor.id,
			usuario_id: usuarioId,
			rol_en_favor: rol as RolEnFavor,
			metodo: metodo as MetodoConfirmacion,
			confirmado_en: new Date().toISOString()
		};
		store.confirmaciones.push(conf);
	}

	if (ServicioCierreFavor.evaluarCierreMutuo(favor.id, favor.creador_id, favor.ayudante_id, store.confirmaciones)) {
		favor.estado = 'cerrado';
		favor.cerrado_en = new Date().toISOString();
	}
	return ok({ ok: true, id: key, favor_estado: favor.estado }, 201);
};
