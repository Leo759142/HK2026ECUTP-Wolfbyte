import { json } from '@sveltejs/kit';
import { puedeRol, type Rol } from '../../dominio/roles/rbac';

export function problem(status: number, title: string, detail?: string) {
	return json(
		{ type: 'about:blank', title, status, detail },
		{ status, headers: { 'content-type': 'application/problem+json' } }
	);
}

export function ok<T>(data: T, status = 200, headers: Record<string, string> = {}) {
	return json(data, {
		status,
		headers: { 'content-type': 'application/json; charset=utf-8', ...headers }
	});
}

export interface SesionApi {
	usuarioId: string | null;
	rol: string;
}

/**
 * Identidad para la API.
 * Preferimos la cookie firmada `pod_sesion`. Si no existe (modo offline/demo o
 * sesión local previa), aceptamos la identidad declarada por el cliente en
 * `x-usuario-id` y el rol en `x-rol` (los hooks ya normalizan `x-rol`).
 * `usuarioId` es null cuando no hay ninguna identidad: así los GET no reescriben
 * el propietario real de un registro con un id genérico.
 */
export function leerSesion(
	request: Request,
	cookies?: { get(nombre: string): string | undefined }
): SesionApi {
	let datos: { usuarioId?: string; rol?: string } = {};
	const crudo = cookies?.get('pod_sesion');
	if (crudo) {
		try {
			datos = JSON.parse(crudo) as typeof datos;
		} catch {
			datos = {};
		}
	}
	const usuarioId =
		datos.usuarioId || request.headers.get('x-usuario-id')?.trim() || null;
	const rol = datos.rol || request.headers.get('x-rol')?.trim() || 'Vecino';
	return { usuarioId, rol };
}

export function requireRol(request: Request, accion: string) {
	const raw = (request.headers.get('x-rol') ?? '').trim();
	const alias: Record<string, Rol> = {
		vecino: 'Vecino',
		referente: 'Referente de manzana',
		emprendedor: 'Emprendedor',
		coordinador: 'Coordinador de emergencia',
		anunciante: 'Anunciante',
		cualquiera: 'Cualquiera'
	};
	const rol = alias[raw.toLowerCase()] ?? raw;
	const roles: Rol[] = [
		'Vecino',
		'Referente de manzana',
		'Emprendedor',
		'Coordinador de emergencia',
		'Anunciante',
		'Cualquiera'
	];
	if (!roles.includes(rol as Rol))
		return problem(401, 'Rol requerido', 'Incluye encabezado X-Rol válido.');
	if (!puedeRol(rol as Rol, accion as never))
		return problem(403, 'Permiso denegado', `El rol ${rol} no puede ejecutar ${accion}.`);
	return rol as Rol;
}
export function requireIdempotency(request: Request) {
	const key = (
		request.headers.get('idempotency-key') ??
		request.headers.get('Idempotency-Key') ??
		''
	).trim();
	if (!key)
		return problem(
			400,
			'Idempotency-Key requerida',
			'Incluye el encabezado Idempotency-Key (UUID, >= 8 caracteres) para escrituras seguras offline/RNF-05.'
		);
	if (key.length < 8)
		return problem(
			400,
			'Idempotency-Key inválida',
			'Idempotency-Key debe tener al menos 8 caracteres.'
		);
	return key;
}
