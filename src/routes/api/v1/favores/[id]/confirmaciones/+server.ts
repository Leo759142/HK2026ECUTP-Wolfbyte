import type { RequestHandler } from './';
import { ok, problem, requireIdempotency } from '../../../_http';
import { obtenerEntidad, listarEntidad, aplicarEntidadLWW } from '../../../_dao-repo';
import { ServicioCierreFavor } from '../../../../../../dominio/favores/cierre';

export const POST: RequestHandler = async ({ request, params }) => {
	const key = requireIdempotency(request);
	if (typeof key !== 'string') return key;

	const previa = await obtenerEntidad('confirmaciones', key);
	if (previa) {
		const favor = await obtenerEntidad('favores', previa.favor_id);
		return ok({ ok: true, replayed: true, id: key, favor_estado: favor?.estado }, 200, {
			'Idempotent-Replayed': 'true'
		});
	}

	const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
	if (!body || typeof body !== 'object' || Array.isArray(body))
		return problem(400, 'JSON inválido', 'El cuerpo debe ser un objeto JSON.');

	const favor = await obtenerEntidad('favores', params.id);
	if (!favor || (favor as Record<string, unknown>).oculto === 1)
		return problem(404, 'Favor no encontrado', 'No existe el favor.');

	const rol = String((body as Record<string, unknown>).rol_en_favor ?? '');
	const metodo = String((body as Record<string, unknown>).metodo ?? '');
	const usuarioId = typeof (body as Record<string, unknown>).usuario_id === 'string' ? ((body as Record<string, unknown>).usuario_id as string).trim() : '';
	if (!['solicitante', 'ayudante'].includes(rol))
		return problem(422, 'Rol inválido', 'rol_en_favor debe ser: solicitante, ayudante.');
	if (!['qr', 'boton'].includes(metodo))
		return problem(422, 'Método inválido', 'metodo debe ser: qr, boton.');
	if (!usuarioId) return problem(422, 'usuario_id requerido', 'Indica quién confirma.');

	if (favor.estado === 'cerrado')
		return problem(409, 'Favor ya cerrado', 'Este favor ya fue confirmado por ambas partes.');
	if (favor.estado !== 'en_curso' || !favor.ayudante_id)
		return problem(409, 'Favor sin ayudante', 'Solo se confirma un favor en curso con ayudante asignado.');

	const esperado = rol === 'solicitante' ? favor.creador_id : favor.ayudante_id;
	if (usuarioId !== esperado)
		return problem(403, 'No corresponde', `El usuario ${usuarioId} no es el ${rol} de este favor.`);;

	const yaConfirmo = (await listarEntidad('confirmaciones')).some(
		(c) => c.favor_id === favor.id && c.usuario_id === usuarioId && c.rol_en_favor === rol
	);
	if (!yaConfirmo) {
		const confirmacion = {
			id: key,
			favor_id: favor.id,
			usuario_id: usuarioId,
			rol_en_favor: rol as 'solicitante' | 'ayudante',
			metodo: metodo as 'qr' | 'boton',
			confirmado_en: new Date().toISOString()
		};
		await aplicarEntidadLWW('confirmaciones', confirmacion);
	}

	if (
		ServicioCierreFavor.evaluarCierreMutuo(
			favor.id,
			favor.creador_id,
			favor.ayudante_id,
			(await listarEntidad('confirmaciones')).filter((c) => c.favor_id === favor.id)
		)
	) {
		await aplicarEntidadLWW('favores', { id: favor.id, estado: 'cerrado', cerrado_en: new Date().toISOString(), updated_at: new Date().toISOString() });
	}
	return ok({ ok: true, id: key, favor_estado: favor.estado }, 201);
};
