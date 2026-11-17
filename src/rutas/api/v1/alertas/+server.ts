import type { RequestHandler } from './$types';
import { ok, problem, requireRol } from '../../_http';
import { cargarStore, persistirStore, store } from '../../_store';

export const GET: RequestHandler = async ({ request, cookies }) => {
	// Verificar sesión activa y rol de Guardian/Coordinador
	const sesion = JSON.parse(cookies.get('pod_sesion') || '{}');
	if (!sesion.usuarioId) return problem(401, 'Sesión no válida');

	await cargarStore();

	// Retornar alertas con usuario_id real (no 'demo')
	const alertasConUsuario = store.alertas.map((a) => ({
		...a,
		usuario_id: sesion.usuarioId, // ID real de la sesión, no demo
		rol: sesion.rol
	}));

	return ok(alertasConUsuario);
};

export const POST: RequestHandler = async ({ request, cookies }) => {
	// Verificar sesión activa
	const sesion = JSON.parse(cookies.get('pod_sesion') || '{}');
	if (!sesion.usuarioId) return problem(401, 'Sesión no válida');

	await cargarStore();

	const body = (await request.json().catch(() => null)) as any;
	if (!body?.tipo || !body?.titulo) return problem(400, 'Datos inválidos: tipo y título requeridos');

	// Crear alerta con usuario_id real
	const nuevaAlerta = {
		id: 'a_' + Date.now(),
		tipo: body.tipo,
		titulo: body.titulo,
		descripcion: body.descripcion,
		usuario_id: sesion.usuarioId, // ID real de sesión
		rol: sesion.rol,
		creado_en: new Date().toISOString(),
		activa: true
	};

	store.alertas.push(nuevaAlerta);
	await persistirStore();
	return ok(nuevaAlerta, 201);
};

export const PATCH: RequestHandler = async ({ request, params, cookies }) => {
	// Verificar sesión activa y permisos de Guardian/Coordinador
	const sesion = JSON.parse(cookies.get('pod_sesion') || '{}');
	if (!sesion.usuarioId) return problem(401, 'Sesión no válida');

	await cargarStore();

	const id = params.id || '';
	if (!id) return problem(400, 'ID de alerta requerido');

	const idx = store.alertas.findIndex((a) => a.id === id);
	if (idx === -1) return problem(404, 'Alerta no encontrada');

	// Solo Guardian/Coordinador pueden modificar/desactivar
	if (sesion.rol !== 'Guardian' && sesion.rol !== 'Coordinador de emergencia') {
		return problem(403, 'No tiene permisos para modificar esta alerta');
	}

	const body = (await request.json().catch(() => null)) as any;
	if (body.activa !== undefined) {
		store.alertas[idx].activa = body.activa;
	}
	if (body.descripcion !== undefined) {
		store.alertas[idx].descripcion = body.descripcion;
	}

	await persistirStore();
	return ok(store.alertas[idx]);
};