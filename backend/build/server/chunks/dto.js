// src/lib/server/dto.ts
var iso = (v) => {
	if (v === null || v === void 0) return null;
	const d = v instanceof Date ? v : new Date(String(v));
	return Number.isNaN(d.getTime()) ? null : d.toISOString();
};
var num = (v) => v === null || v === void 0 ? null : Number(v);
var json = (v, def) => {
	if (v === null || v === void 0) return def;
	if (typeof v === "string") try {
		return JSON.parse(v);
	} catch {
		return def;
	}
	return v;
};
/** Igual que util.nombreVisible del frontend. */
function nombreVisible(nombre, apellido, completo) {
	const a = (apellido ?? "").trim();
	if (completo) return `${nombre} ${a}`.trim();
	return a ? `${nombre} ${a[0]}.` : nombre;
}
/** Columnas de un vecino con prefijo, para usar en SELECT ... JOIN usuarios <alias>. */
function colsVecino(alias, p) {
	return `${alias}.id AS ${p}_id, ${alias}.nombre AS ${p}_nombre, ${alias}.apellido AS ${p}_apellido,
		${alias}.manzana AS ${p}_manzana, ${alias}.foto AS ${p}_foto, ${alias}.mostrar_nombre_completo AS ${p}_completo,
		${alias}.creado_en AS ${p}_creado,
		EXISTS (SELECT 1 FROM sector_guardianes g_${p} WHERE g_${p}.usuario_id = ${alias}.id AND g_${p}.sector_id = ${alias}.sector_id) AS ${p}_guardian`;
}
function vecino(f, p, forzarCompleto = false) {
	if (!f[`${p}_id`]) return null;
	const completo = Boolean(f[`${p}_completo`]) || forzarCompleto;
	return {
		id: String(f[`${p}_id`]),
		nombre: String(f[`${p}_nombre`]),
		nombre_visible: nombreVisible(String(f[`${p}_nombre`]), String(f[`${p}_apellido`] ?? ""), completo),
		manzana: String(f[`${p}_manzana`]),
		foto: f[`${p}_foto`] ?? null,
		es_guardian: Boolean(f[`${p}_guardian`]),
		mostrar_nombre_completo: Boolean(f[`${p}_completo`]),
		creado_en: iso(f[`${p}_creado`])
	};
}
/** Distancia aproximada en cuadras según la letra de la manzana (util.cuadras del frontend). */
function cuadras(a, b) {
	if (!a || !b) return 1;
	return Math.abs(a.charCodeAt(0) - b.charCodeAt(0));
}
function whatsappUrl(telefono, texto) {
	return `https://wa.me/${telefono.replace(/\D/g, "")}?text=${encodeURIComponent(texto)}`;
}
var RESERVA_MS = 36e5;
export { json as a, whatsappUrl as c, iso as i, colsVecino as n, num as o, cuadras as r, vecino as s, RESERVA_MS as t };

//# sourceMappingURL=dto.js.map