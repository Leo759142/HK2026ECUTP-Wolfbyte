import type { RequestHandler } from './$types';
import { leerSesion, ok, problem } from '../../../_http';
import { cargarStore, persistirStore, store } from '../../../_store';
import { esRespuesta, leerObjeto } from '../../../_validar';

export const PATCH: RequestHandler = async ({ request, params, cookies }) => {
	const sesion = leerSesion(request, cookies);

	await cargarStore();

	const id = params.id || '';
	if (!id) return problem(400, 'ID de alerta requerido');

	const idx = store.alertas.findIndex((a) => a.id === id);
	if (idx === -1) return problem(404, 'Alerta no encontrada');

	if (sesion.rol !== 'Guardian' && sesion.rol !== 'Coordinador de emergencia') {
		return problem(403, 'No tiene permisos para modificar esta alerta');
	}

	const b = await leerObjeto(request);
	if (esRespuesta(b)) return b;

	if (b.activa !== undefined) {
		store.alertas[idx].activa = b.activa;
	}
	if (b.descripcion !== undefined) {
		store.alertas[idx].descripcion = b.descripcion;
	}

	await persistirStore();
	return ok(store.alertas[idx]);
};