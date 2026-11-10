import type { RequestHandler } from './$types';
import { ok, problem } from '../../_http';
import { leerObjeto, errorTextos, esRespuesta } from '../../_validar';
import { hashPin } from '../../../../seguridad/pin';
import { listarEntidad, crearEntidad } from '../_dao-repo';

function esAdminOReferente(rol: string | undefined): boolean {
	return rol === 'admin' || rol === 'referente';
}

export const GET: RequestHandler = async ({ cookies, url }) => {
	const raw = cookies.get('pod_sesion');
	if (!raw) return problem(401, 'No autenticado', 'Inicie sesión.');
	try {
		const payload = JSON.parse(decodeURIComponent(raw)) as { usuarioId: string; rol: string; exp: number };
		if (payload.exp && Date.now() > payload.exp) return problem(401, 'Sesión expirada');
		if (!esAdminOReferente(payload.rol))
			return problem(403, 'Permiso denegado', 'Solo admin o referente pueden listar usuarios.');

		const zona = url.searchParams.get('zona_id');
		const rol = url.searchParams.get('rol');
		const items = await listarEntidad('usuarios', (u) => {
			if (rol && String(u.rol) !== rol) return false;
			return true;
		});
		const mapeados = items.map((u) => ({ id: u.id, celular: u.celular, alias: u.alias, rol: u.rol, activo: u.activo }));
		return ok({ items: mapeados, total: mapeados.length });
	} catch {
		return problem(401, 'No autenticado');
	}
};

export const POST: RequestHandler = async ({ cookies, request }) => {
	const raw = cookies.get('pod_sesion');
	if (!raw) return problem(401, 'No autenticado', 'Inicie sesión.');
	try {
		const payload = JSON.parse(decodeURIComponent(raw)) as { usuarioId: string; rol: string; exp: number };
		if (payload.exp && Date.now() > payload.exp) return problem(401, 'Sesión expirada');
		if (payload.rol !== 'admin')
			return problem(403, 'Permiso denegado', 'Solo admin puede crear usuarios mediante este endpoint.');

		const b = await leerObjeto(request);
		if (esRespuesta(b)) return b;
		const err = errorTextos(b, { celular: { min: 9, max: 15 }, alias: { min: 3, max: 40 }, pin: { min: 4, max: 8 }, rol: { max: 20 } });
		if (err) return problem(422, 'Datos inválidos', err);

		const celular = String(b.celular).trim();
		const alias = String(b.alias).trim();
		const pin = String(b.pin);
		const rol = String(b.rol ?? 'vecino');
		const yaExiste = (await listarEntidad('usuarios', (u) => String(u.celular) === celular)).length > 0
			return problem(409, 'Celular ya registrado');

		const pinHash = await hashPin(pin);
		const id = crypto.randomUUID();
		const ahora = new Date().toISOString();
		const usuario = { id, celular, alias, rol, pinHash, activo: 1, creado_en: ahora };
		await crearEntidad('usuarios', usuario);
		return ok({ usuario: { id, celular, alias, rol, activo: 1 } }, 201);
	} catch {
		return problem(401, 'No autenticado');
	}
};