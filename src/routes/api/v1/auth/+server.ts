import type { RequestEvent } from '@sveltejs/kit';
import { ok, problem } from '../../_http';
import { verificarPin, crearSesionPin } from '../../../../seguridad/pin';
import { verificarUsuarioHardcodeado, HARDCODED_USERS } from '../../../../seguridad/usuarios';

// Login: validar celular y PIN, crear cookie sesión firmada
export const _login = async ({ request, cookies }: Pick<RequestEvent, 'request' | 'cookies'>) => {
	const body = (await request.json().catch(() => null)) as {
		celular?: string;
		pin?: string;
	} | null;

	if (!body?.celular || !body?.pin) {
		return problem(400, 'Celular y PIN requeridos');
	}

	const usuario = await verificarUsuarioHardcodeado(body.celular, body.pin);
	if (!usuario) {
		return problem(401, 'Celular o PIN inválido');
	}

	// Crear sesión firmada en cookie
	const sesion = crearSesionPin(usuario.id);
	const exp = Date.now() + 24 * 60 * 60 * 1000; // 24 horas
	const sesionConRol = { ...sesion, exp, rol: usuario.rol ?? 'Vecino' };

	cookies.set('pod_sesion', JSON.stringify(sesionConRol), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: import.meta.env.PROD,
		maxAge: 24 * 60 * 60
	});

	return ok({ usuarioId: usuario.id, rol: usuario.rol ?? 'Vecino' });
};

// Register: crear usuario real (no hardcodeado)
export const _register = async ({
	request,
	cookies
}: Pick<RequestEvent, 'request' | 'cookies'>) => {
	const body = (await request.json().catch(() => null)) as {
		celular?: string;
		pin?: string;
		alias?: string;
	} | null;

	if (!body?.celular || !body?.pin || !body?.alias) {
		return problem(400, 'Celular, PIN y alias requeridos');
	}

	// Política de PIN: mínimo 6 caracteres, no permitir PINs débiles
	const pinDebiles = ['1234', '0000', '1111', '123456', '654321'];
	if (pinDebiles.includes(body.pin)) {
		return problem(400, 'PIN demasiado débil. Usa al menos 6 dígitos.');
	}
	if (body.pin.length < 6) {
		return problem(400, 'El PIN debe tener al menos 6 dígitos');
	}

	// Verificar si el celular ya existe
	const existente = HARDCODED_USERS.find((u) => u.celular === body.celular);
	if (existente) {
		return problem(409, 'Este celular ya está registrado');
	}

	// Hashear PIN con PBKDF2 real
	const { hashPin } = await import('../../../../seguridad/pin');
	const pinHash = await hashPin(body.pin);

	const nuevoUsuario: typeof HARDCODED_USERS[number] = {
		id: `u_${Date.now()}`,
		celular: body.celular,
		alias: body.alias,
		pinHash
	};

	// Agregar a la lista en memoria (desarrollo)
	HARDCODED_USERS.push(nuevoUsuario);

	// Crear sesión firmada
	const sesion = crearSesionPin(nuevoUsuario.id);
	const exp = Date.now() + 24 * 60 * 60 * 1000;
	cookies.set('pod_sesion', JSON.stringify({ ...sesion, exp, rol: 'Vecino' }), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: import.meta.env.PROD,
		maxAge: 24 * 60 * 60
	});

	return ok({
		usuarioId: nuevoUsuario.id,
		rol: 'Vecino',
		registrado: true,
		mensaje: 'Usuario registrado exitosamente'
	});
};
export const _quienSoy = async ({ cookies }: Pick<RequestEvent, 'cookies'>) => {
	const sesion = cookies.get('pod_sesion');
	if (!sesion) return ok({ loggedIn: false, usuarioId: null, rol: null });

	try {
		const payload = JSON.parse(sesion) as { usuarioId: string; rol?: string; exp: number };
		if (payload.exp && Date.now() > payload.exp) {
			return ok({ loggedIn: false, usuarioId: null, rol: null, sesionExpirada: true });
		}
		return ok({
			loggedIn: true,
			usuarioId: payload.usuarioId,
			rol: payload.rol ?? 'Vecino'
		});
	} catch {
		return ok({ loggedIn: false, usuarioId: null, rol: null });
	}
};

export async function GET({ cookies }: RequestEvent) {
	return _quienSoy({ cookies });
}

export async function POST(event: RequestEvent) {
	const body = (await event.request
		.clone()
		.json()
		.catch(() => null)) as { accion?: string } | null;
	return body?.accion === 'registro' ? _register(event) : _login(event);
}

export function DELETE({ cookies }: RequestEvent) {
	cookies.delete('pod_sesion', { path: '/' });
	return ok({ loggedIn: false });
}
