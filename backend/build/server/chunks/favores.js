import { a as json, i as iso, n as colsVecino, s as vecino, t as RESERVA_MS } from "./dto.js";
// src/lib/server/repositorios/favores.ts
var SELECT_FAVOR = `
	SELECT f.*, ${colsVecino("d", "d")}, ${colsVecino("t", "t")}
	  FROM favores f JOIN usuarios d ON d.id = f.dueno_id LEFT JOIN usuarios t ON t.id = f.tomador_id`;
function aDto(f) {
	const reservado = f.reservado_en ? new Date(String(f.reservado_en instanceof Date ? f.reservado_en.toISOString() : f.reservado_en)) : null;
	return {
		id: String(f.id),
		tipo: f.tipo,
		titulo: String(f.titulo),
		detalles: json(f.detalles, {}),
		foto: f.foto ?? null,
		dueno_id: String(f.dueno_id),
		dueno: vecino(f, "d"),
		estado: f.estado,
		moderacion: f.moderacion,
		tomador_id: f.tomador_id ?? null,
		tomador: vecino(f, "t"),
		reservado_en: iso(f.reservado_en),
		minutos_restantes: f.estado === "reservado" && reservado ? Math.max(0, Math.ceil((RESERVA_MS - (Date.now() - reservado.getTime())) / 6e4)) : null,
		dueno_confirmo: Boolean(f.dueno_confirmo),
		tomador_confirmo: Boolean(f.tomador_confirmo),
		cerrado_en: iso(f.cerrado_en),
		creado_en: iso(f.creado_en),
		actualizado_en: iso(f.actualizado_en),
		eliminado_en: iso(f.eliminado_en)
	};
}
/** Un favor reservado que no se concreta en 1 hora vuelve a estar disponible (regla del frontend). */
async function liberarReservasVencidas(db) {
	return (await db.query(`UPDATE favores SET estado = 'disponible', tomador_id = NULL, reservado_en = NULL, dueno_confirmo = false, tomador_confirmo = false
		  WHERE estado = 'reservado' AND reservado_en < now() - interval '1 hour' RETURNING id`)).length;
}
async function listarFavores(db, f) {
	const cond = ["d.sector_id = $1"];
	const p = [f.sectorId, f.yo];
	if (!f.todos) {
		cond.push("f.eliminado_en IS NULL");
		cond.push(`(f.moderacion = 'visible' OR f.dueno_id = $2)`);
		cond.push(`(f.estado <> 'cerrado' OR f.dueno_id = $2 OR f.tomador_id = $2)`);
	}
	if (f.mios) cond.push("(f.dueno_id = $2 OR f.tomador_id = $2)");
	if (f.tipo) cond.push(`f.tipo = $${p.push(f.tipo)}`);
	if (f.estado) cond.push(`f.estado = $${p.push(f.estado)}`);
	if (f.desde) cond.push(`f.actualizado_en > $${p.push(f.desde)}`);
	return (await db.query(`${SELECT_FAVOR} WHERE ${cond.join(" AND ")} AND $2::uuid IS NOT NULL ORDER BY f.creado_en DESC`, p)).map(aDto);
}
async function obtenerFavor(db, id) {
	const [f] = await db.query(`${SELECT_FAVOR.replace("SELECT f.*,", "SELECT f.*, d.sector_id AS sector_id,")} WHERE f.id = $1`, [id]);
	return f ? {
		...aDto(f),
		sector_id: String(f.sector_id)
	} : null;
}
async function crearFavor(db, f) {
	return (await db.query(`INSERT INTO favores (id, dueno_id, tipo, titulo, detalles, foto) VALUES ($1, $2, $3, $4, $5, $6)
		 ON CONFLICT (id) DO NOTHING RETURNING id`, [
		f.id,
		f.duenoId,
		f.tipo,
		f.titulo,
		JSON.stringify(f.detalles),
		f.foto
	])).length > 0;
}
async function actualizarFavor(db, id, c) {
	const sets = [];
	const p = [id];
	if (c.titulo !== void 0) sets.push(`titulo = $${p.push(c.titulo)}`);
	if (c.detalles !== void 0) sets.push(`detalles = $${p.push(JSON.stringify(c.detalles))}`);
	if (c.foto !== void 0) sets.push(`foto = $${p.push(c.foto)}`);
	if (!sets.length) return;
	await db.query(`UPDATE favores SET ${sets.join(", ")} WHERE id = $1`, p);
}
async function eliminarFavor(db, id) {
	await db.query("UPDATE favores SET eliminado_en = now() WHERE id = $1 AND eliminado_en IS NULL", [id]);
}
/** Reserva atómica: solo gana si el favor sigue disponible ("gana el primero"). */
async function reservarFavor(db, id, tomadorId) {
	return (await db.query(`UPDATE favores SET estado = 'reservado', tomador_id = $2, reservado_en = now(), dueno_confirmo = false, tomador_confirmo = false
		  WHERE id = $1 AND estado = 'disponible' AND eliminado_en IS NULL AND moderacion = 'visible' AND dueno_id <> $2
		  RETURNING id`, [id, tomadorId])).length > 0;
}
async function liberarFavor(db, id) {
	return (await db.query(`UPDATE favores SET estado = 'disponible', tomador_id = NULL, reservado_en = NULL, dueno_confirmo = false, tomador_confirmo = false
		  WHERE id = $1 AND estado = 'reservado' RETURNING id`, [id])).length > 0;
}
/** Marca "Listo" de un lado; si el otro ya confirmó, el favor queda cerrado. */
async function confirmarLado(db, id, lado) {
	const col = lado === "dueno" ? "dueno_confirmo" : "tomador_confirmo";
	const otro = lado === "dueno" ? "tomador_confirmo" : "dueno_confirmo";
	return (await db.query(`UPDATE favores SET ${col} = true,
		        estado = CASE WHEN ${otro} THEN 'cerrado' ELSE estado END,
		        cerrado_en = CASE WHEN ${otro} THEN now() ELSE cerrado_en END
		  WHERE id = $1 AND estado = 'reservado' RETURNING id`, [id])).length > 0;
}
var MOTIVOS = [
	"estafa",
	"falso",
	"ofensivo",
	"mala_experiencia",
	"otro"
];
async function crearReporte(db, r) {
	return (await db.query(`INSERT INTO reportes (id, servicio_id, favor_id, usuario_id, motivo) VALUES ($1, $2, $3, $4, $5)
		 ON CONFLICT (id) DO NOTHING RETURNING id`, [
		r.id,
		r.tipo === "servicio" ? r.objetoId : null,
		r.tipo === "favor" ? r.objetoId : null,
		r.usuarioId,
		r.motivo
	])).length > 0;
}
async function misReportes(db, usuarioId) {
	return (await db.query("SELECT * FROM reportes WHERE usuario_id = $1 ORDER BY creado_en DESC", [usuarioId])).map((r) => ({
		id: String(r.id),
		objeto_tipo: r.servicio_id ? "servicio" : "favor",
		objeto_id: String(r.servicio_id ?? r.favor_id),
		usuario_id: String(r.usuario_id),
		motivo: String(r.motivo),
		creado_en: iso(r.creado_en)
	}));
}
async function pendientesModeracion(db, sectorId) {
	return (await db.query(`SELECT p.objeto_id, p.objeto_tipo, p.total_reportes, p.primer_reporte,
		        coalesce(s.titulo, f.titulo) AS titulo, s.descripcion, coalesce(s.moderacion, f.moderacion) AS moderacion,
		        ${colsVecino("u", "d")},
		        (SELECT r.motivo FROM reportes r WHERE r.decision IS NULL AND (r.servicio_id = p.objeto_id OR r.favor_id = p.objeto_id)
		          GROUP BY r.motivo ORDER BY count(*) DESC, r.motivo LIMIT 1) AS motivo_principal
		   FROM v_reportes_pendientes p
		   LEFT JOIN servicios s ON p.objeto_tipo = 'servicio' AND s.id = p.objeto_id
		   LEFT JOIN favores f ON p.objeto_tipo = 'favor' AND f.id = p.objeto_id
		   JOIN usuarios u ON u.id = coalesce(s.dueno_id, f.dueno_id)
		  WHERE u.sector_id = $1 AND coalesce(s.eliminado_en, f.eliminado_en) IS NULL
		  ORDER BY p.primer_reporte`, [sectorId])).map((f) => ({
		objeto_tipo: f.objeto_tipo,
		objeto_id: String(f.objeto_id),
		total_reportes: Number(f.total_reportes),
		titulo: String(f.titulo ?? ""),
		descripcion: f.descripcion ?? null,
		moderacion: String(f.moderacion),
		dueno: vecino(f, "d"),
		motivo_principal: String(f.motivo_principal ?? "otro"),
		primer_reporte: iso(f.primer_reporte)
	}));
}
async function resolverModeracion(db, tipo, objetoId, guardianId, decision) {
	const col = tipo === "servicio" ? "servicio_id" : "favor_id";
	await db.query(`UPDATE reportes SET decision = $2, resuelto_por = $3, resuelto_en = now() WHERE ${col} = $1 AND decision IS NULL`, [
		objetoId,
		decision === "aprobar" ? "aprobado" : "ocultado",
		guardianId
	]);
	const tabla = tipo === "servicio" ? "servicios" : "favores";
	await db.query(`UPDATE ${tabla} SET moderacion = $2 WHERE id = $1`, [objetoId, decision === "aprobar" ? "visible" : "oculto"]);
}
export { crearReporte as a, liberarReservasVencidas as c, obtenerFavor as d, pendientesModeracion as f, crearFavor as i, listarFavores as l, resolverModeracion as m, actualizarFavor as n, eliminarFavor as o, reservarFavor as p, confirmarLado as r, liberarFavor as s, MOTIVOS as t, misReportes as u };

//# sourceMappingURL=favores.js.map