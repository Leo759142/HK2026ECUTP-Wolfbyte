import type { RequestHandler } from './$types';
import { ok, problem, requireIdempotency } from '../../_http';
import { leerObjeto, errorTextos, esRespuesta } from '../../_validar';
import { hashPin, verificarPin } from '../../../../seguridad/pin';
import { listarEntidad, crearEntidad } from '../_dao-repo';

const TTL_MS = 24 * 60 * 60 * 1000;

function cookieHeader(usuarioId, rol) {
	const exp = Date.now() + TTL_MS;
	const payload = encodeURIComponent(JSON.stringify({ usuarioId, rol, exp }));
	const maxAge = Math.floor(TTL_MS / 1000);
	return [
		`pod_sesion=${payload}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`,
		`pod_rol=${rol}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`
	].join(', ');
}

function borrarCookies() {
	return [
		'pod_sesion=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
		'pod_rol=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
	].join(', ');
}

export const POST: RequestHandler = async ({ request, url }) => {
	const path = url.pathname;

	// REGISTRO
	if (path.endsWith('/registro')) {
		const key = requireIdempotency(request);
		if (typeof key !== 'string') return key;
		const b = await leerObjeto(request);
		if (esRespuesta(b)) return b;

		const err = errorTextos(b, {
			celular: { min: 9, max: 15 },
			alias: { min: 3, max: 40 },
			pin: { min: 4, max: 8 }
		});
		if (err) return problem(422, 'Datos inválidos', err);

		const celular = String(b.celular).trim();
		const alias = String(b.alias).trim();
		const pin = String(b.pin);

		const yaExiste = (await listarEntidad('usuarios', (u) => String(u.celular) === celular)).length > 0;
		if (yaExiste) return problem(409, 'Celular ya registrado', 'Este número ya tiene cuenta.');

		const pinHash = await hashPin(pin);
		const id = crypto.randomUUID();
		const ahora = new Date().toISOString();
		const usuario = { id, celular, alias, rol: 'vecino', pinHash, activo: 1, creado_en: ahora, updated_at: ahora };
		await crearEntidad('usuarios', usuario);

		return ok(
			{ usuario: { id, celular, alias, rol: 'vecino' } },
			201,
			{ 'Set-Cookie': cookieHeader(id, 'vecino') }
		);
	}

	// LOGIN
	if (path.endsWith('/sesion')) {
		const b = await leerObjeto(request);
		if (esRespuesta(b)) return b;

		const celular = String(b.celular ?? '').trim();
		const pin = String(b.pin ?? '');

		if (!celular || !pin)
			return problem(422, 'Credenciales requeridas', 'Ingrese celular y PIN.');

		const usuario = (await listarEntidad('usuarios', (u) => String(u.celular) === celular))[0];
		if (!usuario || !usuario.pinHash)
			return problem(401, 'Credenciales inválidas', 'Celular o PIN incorrectos.');

		const valido = await verificarPin(pin, String(usuario.pinHash));
		if (!valido) return problem(401, 'Credenciales inválidas', 'Celular o PIN incorrectos.');
		if (!usuario.activo) return problem(403, 'Cuenta inactiva', 'Contacte al referente de su zona.');

		return ok(
			{
				usuario: { id: usuario.id, celular: usuario.celular, alias: usuario.alias, rol: usuario.rol }
			},
			200,
			{ 'Set-Cookie': cookieHeader(String(usuario.id), String(usuario.rol)) }
		);
	}

	return problem(404, 'Endpoint no encontrado');
};

export const DELETE: RequestHandler = async ({ url }) => {
	if (!url.pathname.endsWith('/sesion')) return problem(404, 'Endpoint no encontrado');
	return ok({ ok: true, mensaje: 'Sesión cerrada' }, 200, { 'Set-Cookie': borrarCookies() });
};

export const GET: RequestHandler = async ({ url, cookies }) => {
	if (!url.pathname.endsWith('/sesion')) return problem(404, 'Endpoint no encontrado');
	const raw = cookies.get('pod_sesion');
	if (!raw) return ok({ loggedIn: false }, 200);
	try {
		const payload = JSON.parse(decodeURIComponent(raw)) as { usuarioId: string; rol: string; exp: number };
		if (payload.exp && Date.now() > payload.exp) return ok({ loggedIn: false }, 200);
		const u = await obtenerEntidad('usuarios', payload.usuarioId);
		return ok({
			loggedIn: true,
			usuarioId: payload.usuarioId,
			rol: payload.rol,
			alias: u?.alias ?? null,
			celular: u?.celular ?? null
		}, 200);
	} catch {
		return ok({ loggedIn: false }, 200);
	}
};
