import { t as config } from "./config2.js";
import { n as sha256, t as nuevoToken } from "./ids.js";
// src/lib/server/auth/sesion.ts
var COOKIE_SESION = "ayni_sesion";
async function crearSesion(db, datos) {
	const token = nuevoToken();
	const duracionMs = datos.proposito === "registro" ? 18e5 : config().sesionDias * 24 * 60 * 60 * 1e3;
	const expira = new Date(Date.now() + duracionMs);
	const [fila] = await db.query(`INSERT INTO sesiones (usuario_id, telefono, token_hash, proposito, plataforma, expira_en)
		 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`, [
		datos.usuarioId,
		datos.telefono,
		sha256(token),
		datos.proposito,
		datos.plataforma ?? "web",
		expira
	]);
	return {
		token,
		sesionId: fila.id,
		expira
	};
}
async function leerSesion(db, token) {
	const [s] = await db.query(`SELECT s.id, s.proposito, s.telefono, s.usuario_id, u.sector_id, u.manzana, u.rol_plataforma,
		        EXISTS (SELECT 1 FROM sector_guardianes g WHERE g.usuario_id = u.id AND g.sector_id = u.sector_id) AS es_guardian
		   FROM sesiones s LEFT JOIN usuarios u ON u.id = s.usuario_id
		  WHERE s.token_hash = $1 AND NOT s.revocada AND s.expira_en > now()`, [sha256(token)]);
	if (!s) return {
		sesion: null,
		registro: null
	};
	if (s.proposito === "registro" || !s.usuario_id) return {
		sesion: null,
		registro: {
			sesionId: s.id,
			telefono: s.telefono
		}
	};
	return {
		sesion: {
			sesionId: s.id,
			usuarioId: s.usuario_id,
			telefono: s.telefono,
			sectorId: s.sector_id,
			manzana: s.manzana,
			esGuardian: Boolean(s.es_guardian),
			esAdmin: s.rol_plataforma === "admin"
		},
		registro: null
	};
}
async function revocarSesion(db, sesionId) {
	await db.query("UPDATE sesiones SET revocada = true WHERE id = $1", [sesionId]);
}
function tokenDeRequest(request, cookies) {
	const auth = request.headers.get("authorization") ?? "";
	const m = /^Bearer\s+([A-Za-z0-9_-]{20,200})$/.exec(auth.trim());
	if (m) return m[1];
	const c = cookies.get(COOKIE_SESION);
	return c && /^[A-Za-z0-9_-]{20,200}$/.test(c) ? c : null;
}
function guardarCookie(cookies, token, expira) {
	cookies.set(COOKIE_SESION, token, {
		path: "/",
		httpOnly: true,
		sameSite: "lax",
		secure: config().cookieSegura,
		expires: expira
	});
}
function borrarCookie(cookies) {
	cookies.delete(COOKIE_SESION, {
		path: "/",
		secure: config().cookieSegura
	});
}
export { revocarSesion as a, leerSesion as i, crearSesion as n, tokenDeRequest as o, guardarCookie as r, borrarCookie as t };

//# sourceMappingURL=sesion.js.map