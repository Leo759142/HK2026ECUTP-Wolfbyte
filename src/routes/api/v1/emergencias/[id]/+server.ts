import type { RequestHandler } from './$types';
import { ok, problem, requireRol } from '../../../_http';
import { cargarStore, persistirStore, store } from '../../../_store';
import { esRespuesta, leerObjeto } from '../../../_validar';

export const PATCH: RequestHandler = async ({ request, params, cookies }) => {
	const sesion = JSON.parse(cookies.get('pod_sesion') || '{}');
	if (!sesion.usuarioId) return problem(401, 'Sesión no válida');

	await cargarStore();
	const rol = requireRol(request, 'activar_emergencia');
	if (!(typeof rol === 'string')) return rol;

	const id = params.id || '';
	if (!id) return problem(400, 'ID de emergencia requerido');

	const b = await leerObjeto(request);
	if (esRespuesta(b)) return b;

	const idx = store.emergencias.findIndex((e) => e.id === id);
	if (idx === -1) return problem(404, 'Emergencia no encontrada');

	if (sesion.rol !== 'Guardian' && sesion.rol !== 'Coordinador de emergencia') {
		return problem(403, 'No tiene permisos para modificar esta emergencia');
	}

	if (b.fin) {
		store.emergencias[idx].fin = b.fin;
	} else {
		store.emergencias[idx].tipo = b.tipo ?? store.emergencias[idx].tipo;
		store.emergencias[idx].titulo = b.titulo ?? store.emergencias[idx].titulo;
		store.emergencias[idx].zona_id = b.zona_id ?? store.emergencias[idx].zona_id;
	}

	await persistirStore();
	return ok(store.emergencias[idx]);
};