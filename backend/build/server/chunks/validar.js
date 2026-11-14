import { n as err } from "./http.js";
// src/lib/server/validar.ts
/** Validación de entrada. Cada función lanza un 422 con un mensaje para el vecino. */
var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var esUuid = (v) => typeof v === "string" && UUID.test(v);
function uuid(v, campo) {
	if (!esUuid(v)) throw err.invalido(`${campo} debe ser un identificador válido (UUID).`);
	return v.toLowerCase();
}
function texto(v, campo, r = {}) {
	if (v === void 0 || v === null) {
		if (r.opcional) return "";
		throw err.invalido(`Falta ${campo}.`);
	}
	if (typeof v !== "string") throw err.invalido(`${campo} debe ser texto.`);
	const t = v.trim();
	if (r.min !== void 0 && t.length < r.min) throw err.invalido(`${campo} debe tener al menos ${r.min} caracteres.`);
	if (r.max !== void 0 && t.length > r.max) throw err.invalido(`${campo} no puede superar ${r.max} caracteres.`);
	return t;
}
function textoONull(v, campo, r = {}) {
	if (v === void 0 || v === null) return null;
	const t = texto(v, campo, {
		...r,
		opcional: true
	});
	return t === "" ? null : t;
}
function opcion(v, campo, opciones) {
	if (typeof v !== "string" || !opciones.includes(v)) throw err.invalido(`${campo} debe ser uno de: ${opciones.join(", ")}.`);
	return v;
}
function booleano(v, campo) {
	if (typeof v !== "boolean") throw err.invalido(`${campo} debe ser verdadero o falso.`);
	return v;
}
function entero(v, campo, min, max) {
	if (typeof v !== "number" || !Number.isInteger(v) || v < min || v > max) throw err.invalido(`${campo} debe ser un número entre ${min} y ${max}.`);
	return v;
}
function telefono(v) {
	const t = typeof v === "string" ? v.replace(/\D/g, "") : "";
	const completo = t.length === 9 ? `51${t}` : t;
	if (!/^519\d{8}$/.test(completo)) throw err.invalido("El celular debe tener 9 dígitos y empezar con 9.", "TELEFONO_INVALIDO");
	return completo;
}
function manzana(v) {
	if (typeof v !== "string" || !/^[A-J]$/.test(v)) throw err.invalido("La manzana debe ser una letra de la A a la J.");
	return v;
}
/** Coordenadas aproximadas: se guardan con 3 decimales (~100 m), nunca la ubicación exacta. */
function coordenada(v, campo, limite) {
	if (v === void 0 || v === null) return null;
	if (typeof v !== "number" || !Number.isFinite(v) || Math.abs(v) > limite) throw err.invalido(`${campo} no es una coordenada válida.`);
	return Math.round(v * 1e3) / 1e3;
}
/** Foto opcional: URL https o imagen JPEG/PNG/WebP en data-URL comprimida (≤ 480 px en el cliente). */
function foto(v) {
	if (v === void 0 || v === null || v === "") return null;
	if (typeof v !== "string") throw err.invalido("La foto no es válida.");
	const esDataUrl = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(v);
	const esUrl = /^https:\/\/[^\s]+$/.test(v);
	if (!esDataUrl && !esUrl) throw err.invalido("La foto debe ser una imagen JPEG, PNG o WebP.");
	if (v.length > 4e5) throw err.invalido("La foto es muy pesada. Elige otra o tómala de nuevo.");
	return v;
}
/** Objeto de textos cortos (detalles de un favor). */
function detalles(v) {
	if (v === void 0 || v === null) return {};
	if (typeof v !== "object" || Array.isArray(v)) throw err.invalido("Los detalles no son válidos.");
	const out = {};
	for (const [k, val] of Object.entries(v)) {
		if (!/^[a-z_]{1,30}$/.test(k)) throw err.invalido("Los detalles tienen un campo no válido.");
		if (val === null || val === void 0) continue;
		if (typeof val !== "string" || val.length > 200) throw err.invalido("Cada detalle debe ser un texto corto.");
		out[k] = val.trim();
	}
	return out;
}
function fechaIso(v, campo) {
	if (v === void 0 || v === null) return null;
	const d = typeof v === "string" || typeof v === "number" ? new Date(v) : null;
	if (!d || Number.isNaN(d.getTime())) throw err.invalido(`${campo} debe ser una fecha válida.`);
	return d;
}
function listaUnica(v, campo, opciones, min, max) {
	if (!Array.isArray(v)) throw err.invalido(`${campo} debe ser una lista.`);
	const unicos = [...new Set(v)];
	if (unicos.length < min || unicos.length > max) throw err.invalido(`${campo}: elige entre ${min} y ${max}.`);
	return unicos.map((x) => opcion(x, campo, opciones));
}
export { esUuid as a, listaUnica as c, telefono as d, texto as f, entero as i, manzana as l, uuid as m, coordenada as n, fechaIso as o, textoONull as p, detalles as r, foto as s, booleano as t, opcion as u };

//# sourceMappingURL=validar.js.map