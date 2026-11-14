import { t as config } from "../chunks/config2.js";
import { r as json, s as obtenerDb } from "../chunks/http.js";
import { i as leerSesion, o as tokenDeRequest } from "../chunks/sesion.js";
// src/hooks.server.ts
var VENTANA_MS = 6e4;
var LIMITE_GENERAL = 600;
var LIMITE_AUTH = 30;
var contador = /* @__PURE__ */ new Map();
function permitido(clave, limite) {
	const ahora = Date.now();
	const r = contador.get(clave);
	if (!r || ahora - r.inicio > VENTANA_MS) {
		contador.set(clave, {
			inicio: ahora,
			n: 1
		});
		if (contador.size > 1e4) {
			for (const [k, x] of contador) if (ahora - x.inicio > VENTANA_MS) contador.delete(k);
		}
		return true;
	}
	r.n += 1;
	return r.n <= limite;
}
function cabecerasCors(origen) {
	if (!origen || !config().corsOrigins.includes(origen)) return {};
	return {
		"access-control-allow-origin": origen,
		"access-control-allow-credentials": "true",
		"access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
		"access-control-allow-headers": "content-type, authorization",
		"access-control-max-age": "600",
		vary: "Origin"
	};
}
var handle = async ({ event, resolve }) => {
	event.locals.sesion = null;
	event.locals.registro = null;
	const { url, request } = event;
	if (!url.pathname.startsWith("/api/")) return resolve(event);
	const origen = request.headers.get("origin");
	const cors = cabecerasCors(origen);
	if (request.method === "OPTIONS") return new Response(null, {
		status: 204,
		headers: cors
	});
	const cfg = config();
	const escritura = !["GET", "HEAD"].includes(request.method);
	if (cfg.produccion && escritura && origen && origen !== url.origin && !cfg.corsOrigins.includes(origen)) return json({
		codigo: "ORIGEN_NO_PERMITIDO",
		mensaje: "Origen no permitido."
	}, 403);
	let ip = "desconocida";
	try {
		ip = event.getClientAddress();
	} catch {}
	const esAuth = url.pathname.startsWith("/api/v1/auth/");
	if (!permitido(`${ip}:${esAuth ? "auth" : "api"}`, esAuth ? LIMITE_AUTH : LIMITE_GENERAL)) return json({
		codigo: "LIMITE_EXCEDIDO",
		mensaje: "Demasiadas peticiones. Espera un momento e inténtalo otra vez."
	}, 429, cors);
	const token = tokenDeRequest(request, event.cookies);
	if (token) try {
		const { sesion, registro } = await leerSesion(await obtenerDb(), token);
		event.locals.sesion = sesion;
		event.locals.registro = registro;
	} catch (e) {
		console.error("[AYNI] No se pudo leer la sesión:", e);
		return json({
			codigo: "BASE_NO_DISPONIBLE",
			mensaje: "El servidor no puede conectarse a la base de datos."
		}, 503, cors);
	}
	const res = await resolve(event);
	const h = new Headers(res.headers);
	for (const [k, v] of Object.entries(cors)) h.set(k, v);
	h.set("x-content-type-options", "nosniff");
	h.set("referrer-policy", "no-referrer");
	if (!h.has("cache-control")) h.set("cache-control", "no-store");
	return new Response(res.body, {
		status: res.status,
		statusText: res.statusText,
		headers: h
	});
};
var handleError = ({ kind, error }) => {
	if (kind === "unknown") console.error("[AYNI] Error no controlado:", error);
	return {
		codigo: "ERROR_INTERNO",
		mensaje: "Algo salió mal en el servidor. Inténtalo otra vez en un momento."
	};
};
export { handle, handleError };

//# sourceMappingURL=hooks.server.js.map