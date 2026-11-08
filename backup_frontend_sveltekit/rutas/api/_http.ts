import { json } from '@sveltejs/kit';
import { puedeRol, type Rol } from '../../dominio/roles/rbac';

export function problem(status: number, title: string, detail?: string) {
	return json(
		{ type: 'about:blank', title, status, detail },
		{ status, headers: { 'content-type': 'application/problem+json' } }
	);
}

export function ok<T>(data: T, status = 200, headers: Record<string, string> = {}) {
	return json(data, { status, headers: { 'content-type': 'application/json; charset=utf-8', ...headers } });
}

export function requireRol(request: Request, accion: string) {
	const raw = (request.headers.get('x-rol') ?? '').trim();
	const roles: Rol[] = ['Vecino', 'Referente de manzana', 'Emprendedor', 'Coordinador de emergencia', 'Anunciante', 'Cualquiera'];
	if (!roles.includes(raw as Rol)) return problem(401, 'Rol requerido', 'Incluye encabezado X-Rol válido.');
	if (!puedeRol(raw as Rol, accion as never)) return problem(403, 'Permiso denegado', `El rol ${raw} no puede ejecutar ${accion}.`);
	return raw as Rol;
}
export function requireIdempotency(request: Request) {
	const key = (request.headers.get('idempotency-key') ?? request.headers.get('Idempotency-Key') ?? '').trim();
	if (!key) return problem(400, 'Idempotency-Key requerida', 'Incluye el encabezado Idempotency-Key (UUID, >= 8 caracteres) para escrituras seguras offline/RNF-05.');
	if (key.length < 8) return problem(400, 'Idempotency-Key inválida', 'Idempotency-Key debe tener al menos 8 caracteres.');
	return key;
}
