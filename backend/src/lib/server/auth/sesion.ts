/**
 * Sesiones (tabla `sesiones`). Un solo mecanismo de autenticación para toda la API:
 * - Token opaco aleatorio (256 bits); en la base solo se guarda su SHA-256 (token_hash).
 * - El navegador lo recibe en una cookie httpOnly `ayni_sesion` (no queda en localStorage);
 *   otros clientes (Swagger, apps) pueden mandarlo como `Authorization: Bearer <token>`.
 * - El rol NO viaja en cookies ni encabezados: se calcula siempre desde la base
 *   (Guardián = fila en sector_guardianes, admin = usuarios.rol_plataforma).
 */
import type { Cookies } from '@sveltejs/kit';
import { config } from '../config.ts';
import { nuevoToken, sha256 } from '../ids.ts';
import type { Consulta } from '../db/index.ts';

export const COOKIE_SESION = 'ayni_sesion';

export interface SesionActual {
	sesionId: string;
	usuarioId: string;
	telefono: string;
	sectorId: string;
	manzana: string;
	esGuardian: boolean;
	esAdmin: boolean;
}

export type Plataforma = 'android' | 'ios' | 'web' | 'otro';

export async function crearSesion(
	db: Consulta,
	datos: { usuarioId: string | null; telefono: string; proposito: 'sesion' | 'registro'; plataforma?: Plataforma }
): Promise<{ token: string; sesionId: string; expira: Date }> {
	const token = nuevoToken();
	const duracionMs = datos.proposito === 'registro' ? 30 * 60 * 1000 : config().sesionDias * 24 * 60 * 60 * 1000;
	const expira = new Date(Date.now() + duracionMs);
	const [fila] = await db.query<{ id: string }>(
		`INSERT INTO sesiones (usuario_id, telefono, token_hash, proposito, plataforma, expira_en)
		 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
		[datos.usuarioId, datos.telefono, sha256(token), datos.proposito, datos.plataforma ?? 'web', expira]
	);
	return { token, sesionId: fila.id, expira };
}

interface FilaSesion {
	id: string;
	proposito: 'sesion' | 'registro';
	telefono: string;
	usuario_id: string | null;
	sector_id: string | null;
	manzana: string | null;
	rol_plataforma: string | null;
	es_guardian: boolean;
}

export async function leerSesion(
	db: Consulta,
	token: string
): Promise<{ sesion: SesionActual | null; registro: { sesionId: string; telefono: string } | null }> {
	const [s] = await db.query<FilaSesion>(
		`SELECT s.id, s.proposito, s.telefono, s.usuario_id, u.sector_id, u.manzana, u.rol_plataforma,
		        EXISTS (SELECT 1 FROM sector_guardianes g WHERE g.usuario_id = u.id AND g.sector_id = u.sector_id) AS es_guardian
		   FROM sesiones s LEFT JOIN usuarios u ON u.id = s.usuario_id
		  WHERE s.token_hash = $1 AND NOT s.revocada AND s.expira_en > now()`,
		[sha256(token)]
	);
	if (!s) return { sesion: null, registro: null };
	if (s.proposito === 'registro' || !s.usuario_id) {
		return { sesion: null, registro: { sesionId: s.id, telefono: s.telefono } };
	}
	return {
		sesion: {
			sesionId: s.id,
			usuarioId: s.usuario_id,
			telefono: s.telefono,
			sectorId: s.sector_id as string,
			manzana: s.manzana as string,
			esGuardian: Boolean(s.es_guardian),
			esAdmin: s.rol_plataforma === 'admin'
		},
		registro: null
	};
}

export async function revocarSesion(db: Consulta, sesionId: string): Promise<void> {
	await db.query('UPDATE sesiones SET revocada = true WHERE id = $1', [sesionId]);
}

export function tokenDeRequest(request: Request, cookies: Cookies): string | null {
	const auth = request.headers.get('authorization') ?? '';
	const m = /^Bearer\s+([A-Za-z0-9_-]{20,200})$/.exec(auth.trim());
	if (m) return m[1];
	const c = cookies.get(COOKIE_SESION);
	return c && /^[A-Za-z0-9_-]{20,200}$/.test(c) ? c : null;
}

export function guardarCookie(cookies: Cookies, token: string, expira: Date): void {
	cookies.set(COOKIE_SESION, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: config().cookieSegura,
		expires: expira
	});
}

export function borrarCookie(cookies: Cookies): void {
	cookies.delete(COOKIE_SESION, { path: '/', secure: config().cookieSegura });
}
