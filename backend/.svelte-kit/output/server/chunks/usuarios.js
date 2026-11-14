import { i as iso, n as colsVecino, o as num, s as vecino } from "./dto.js";
// src/lib/server/repositorios/usuarios.ts
var DIA = 864e5;
var diasDesde = (fecha) => Math.max(0, Math.floor((Date.now() - new Date(String(fecha instanceof Date ? fecha.toISOString() : fecha)).getTime()) / DIA));
/** Mi cuenta completa (solo para el propio usuario: incluye teléfono y dirección). */
async function obtenerUsuario(db, id) {
	const [u] = await db.query(`SELECT u.*,
		        EXISTS (SELECT 1 FROM sector_guardianes g WHERE g.usuario_id = u.id AND g.sector_id = u.sector_id) AS es_guardian,
		        coalesce((SELECT vistos_buenos FROM v_vecino_stats v WHERE v.usuario_id = u.id), 0) AS vistos
		   FROM usuarios u WHERE u.id = $1`, [id]);
	if (!u) return null;
	const dias = diasDesde(u.creado_en);
	const requeridos = Number(process.env.VISTOS_BUENOS_PARA_GUARDIAN ?? 0);
	const vistos = Number(u.vistos ?? 0);
	return {
		id: String(u.id),
		nombre: String(u.nombre),
		apellido: String(u.apellido ?? ""),
		telefono: String(u.telefono),
		sector_id: String(u.sector_id),
		manzana: String(u.manzana),
		lat_aprox: num(u.lat_aprox),
		lng_aprox: num(u.lng_aprox),
		foto: u.foto ?? null,
		distrito: u.distrito ?? null,
		direccion: u.direccion ?? null,
		referencia: u.referencia ?? null,
		verificado: Boolean(u.verificado),
		mostrar_nombre_completo: Boolean(u.mostrar_nombre_completo),
		invitacion_guardian: u.invitacion_guardian ?? null,
		idioma: u.idioma,
		letra_grande: Boolean(u.letra_grande),
		rol_plataforma: u.rol_plataforma,
		es_guardian: Boolean(u.es_guardian),
		dias_en_ayni: dias,
		camino_guardian: {
			dias_en_ayni: dias,
			dias_requeridos: 60,
			vistos_buenos_actuales: vistos,
			vistos_buenos_requeridos: requeridos,
			elegible: dias >= 60 && vistos >= requeridos
		},
		creado_en: iso(u.creado_en),
		actualizado_en: iso(u.actualizado_en)
	};
}
async function idPorTelefono(db, telefono) {
	const [u] = await db.query("SELECT id FROM usuarios WHERE telefono = $1", [telefono]);
	return u?.id ?? null;
}
async function crearUsuario(db, u) {
	const [fila] = await db.query(`INSERT INTO usuarios (id, nombre, apellido, telefono, sector_id, manzana, lat_aprox, lng_aprox, foto, distrito, direccion, referencia, idioma, invitacion_guardian)
		 VALUES (coalesce($1::uuid, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`, [
		u.id ?? null,
		u.nombre,
		u.apellido,
		u.telefono,
		u.sectorId,
		u.manzana,
		u.lat,
		u.lng,
		u.foto,
		u.distrito,
		u.direccion,
		u.referencia,
		u.idioma,
		u.invitacion
	]);
	return fila.id;
}
var EDITABLES = [
	"mostrar_nombre_completo",
	"idioma",
	"letra_grande",
	"manzana",
	"foto",
	"distrito",
	"direccion",
	"referencia",
	"invitacion_guardian"
];
async function actualizarUsuario(db, id, cambios) {
	const campos = EDITABLES.filter((c) => c in cambios);
	if (campos.length === 0) return;
	const sets = campos.map((c, i) => `${c} = $${i + 2}`).join(", ");
	await db.query(`UPDATE usuarios SET ${sets} WHERE id = $1`, [id, ...campos.map((c) => cambios[c])]);
}
/** Vecinos de un sector, solo con datos públicos (para mostrar quién publica, recomienda o ayuda). */
async function vecinosDelSector(db, sectorId, desde = null) {
	return (await db.query(`SELECT ${colsVecino("u", "v")} FROM usuarios u
		  WHERE u.sector_id = $1 AND ($2::timestamptz IS NULL OR u.actualizado_en > $2 OR u.creado_en > $2)
		  ORDER BY u.creado_en`, [sectorId, desde])).map((f) => vecino(f, "v"));
}
async function perfilVecino(db, id, sectorId) {
	const [f] = await db.query(`SELECT ${colsVecino("u", "v")}, b.dados, b.recibidos, s.publicaciones, s.vistos_buenos
		   FROM usuarios u
		   JOIN v_balance_ayni b ON b.usuario_id = u.id
		   JOIN v_vecino_stats s ON s.usuario_id = u.id
		  WHERE u.id = $1 AND u.sector_id = $2`, [id, sectorId]);
	if (!f) return null;
	return {
		...vecino(f, "v"),
		balance_ayni: {
			dados: Number(f.dados ?? 0),
			recibidos: Number(f.recibidos ?? 0)
		},
		stats: {
			publicaciones: Number(f.publicaciones ?? 0),
			vistos_buenos: Number(f.vistos_buenos ?? 0)
		}
	};
}
async function telefonoDe(db, id) {
	const [u] = await db.query("SELECT telefono FROM usuarios WHERE id = $1", [id]);
	return u?.telefono ?? null;
}
export { perfilVecino as a, obtenerUsuario as i, crearUsuario as n, telefonoDe as o, idPorTelefono as r, vecinosDelSector as s, actualizarUsuario as t };

//# sourceMappingURL=usuarios.js.map