import { a as json, i as iso, n as colsVecino, r as cuadras, s as vecino } from "./dto.js";
// src/lib/server/repositorios/servicios.ts
var SELECT_SERVICIO = `
	SELECT s.*, ${colsVecino("u", "d")},
	       (SELECT count(*)::int FROM recomendaciones r WHERE r.servicio_id = s.id) AS recos,
	       (SELECT coalesce(jsonb_object_agg(e.etiqueta, e.cantidad), '{}'::jsonb) FROM v_servicio_etiquetas e WHERE e.servicio_id = s.id) AS etiquetas_reco
	  FROM servicios s JOIN usuarios u ON u.id = s.dueno_id`;
function aDto(f, miManzana) {
	const base = json(f.etiquetas_base, {});
	const reco = json(f.etiquetas_reco, {});
	const total = { ...base };
	for (const [k, v] of Object.entries(reco)) total[k] = (total[k] ?? 0) + Number(v);
	const dueno = vecino(f, "d", Boolean(f.mostrar_nombre_completo));
	return {
		id: String(f.id),
		clase: f.clase,
		categoria: String(f.categoria),
		titulo: String(f.titulo),
		descripcion: String(f.descripcion),
		horario: String(f.horario),
		precio: f.precio ?? null,
		foto: f.foto ?? null,
		mostrar_nombre_completo: Boolean(f.mostrar_nombre_completo),
		dueno_id: String(f.dueno_id),
		dueno,
		estado: f.estado,
		moderacion: f.moderacion,
		total_vistos_buenos: Number(f.vistos_base ?? 0) + Number(f.recos ?? 0),
		vistos_base: Number(f.vistos_base ?? 0),
		etiquetas_base: base,
		etiquetas: Object.entries(total).map(([etiqueta, cantidad]) => ({
			etiqueta,
			cantidad: Number(cantidad)
		})).sort((a, b) => b.cantidad - a.cantidad),
		distancia_cuadras: cuadras(miManzana, dueno?.manzana),
		creado_en: iso(f.creado_en),
		actualizado_en: iso(f.actualizado_en),
		eliminado_en: iso(f.eliminado_en)
	};
}
async function listarServicios(db, f) {
	const cond = ["u.sector_id = $1"];
	const p = [f.sectorId, f.yo];
	if (!f.todos) {
		cond.push(`s.eliminado_en IS NULL`);
		cond.push(`((s.estado = 'disponible' AND s.moderacion = 'visible') OR (s.dueno_id = $2 AND s.moderacion <> 'oculto'))`);
	}
	if (f.mios) cond.push("s.dueno_id = $2");
	if (f.categoria) cond.push(`s.categoria = $${p.push(f.categoria)}`);
	if (f.clase) cond.push(`s.clase = $${p.push(f.clase)}`);
	if (f.q) cond.push(`(s.titulo ILIKE $${p.push(`%${f.q}%`)} OR s.descripcion ILIKE $${p.length})`);
	if (f.desde) cond.push(`s.actualizado_en > $${p.push(f.desde)}`);
	let lista = (await db.query(`${SELECT_SERVICIO} WHERE ${cond.join(" AND ")} AND $2::uuid IS NOT NULL`, p)).map((x) => aDto(x, f.miManzana));
	if (f.soloRecomendados) lista = lista.filter((s) => s.total_vistos_buenos > 0);
	return lista;
}
async function obtenerServicio(db, id, miManzana) {
	const [f] = await db.query(`${SELECT_SERVICIO} WHERE s.id = $1`, [id]);
	return f ? aDto(f, miManzana) : null;
}
/** Fila mínima para validar permisos (dueño, sector, borrado). */
async function filaServicio(db, id) {
	const [f] = await db.query(`SELECT s.id, s.dueno_id, u.sector_id, s.eliminado_en, s.actualizado_en, s.moderacion, s.estado
		   FROM servicios s JOIN usuarios u ON u.id = s.dueno_id WHERE s.id = $1`, [id]);
	return f ?? null;
}
/** Crea el servicio. Si el id ya existe (reintento), no hace nada. Devuelve true si lo creó. */
async function crearServicio(db, id, duenoId, d) {
	return (await db.query(`INSERT INTO servicios (id, dueno_id, clase, categoria, titulo, descripcion, horario, precio, foto, mostrar_nombre_completo)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (id) DO NOTHING RETURNING id`, [
		id,
		duenoId,
		d.clase,
		d.categoria,
		d.titulo,
		d.descripcion,
		d.horario,
		d.precio,
		d.foto,
		d.mostrar_nombre_completo
	])).length > 0;
}
var EDITABLES = [
	"clase",
	"categoria",
	"titulo",
	"descripcion",
	"horario",
	"precio",
	"foto",
	"mostrar_nombre_completo",
	"estado"
];
async function actualizarServicio(db, id, cambios) {
	const campos = EDITABLES.filter((c) => c in cambios);
	if (!campos.length) return;
	await db.query(`UPDATE servicios SET ${campos.map((c, i) => `${c} = $${i + 2}`).join(", ")} WHERE id = $1`, [id, ...campos.map((c) => cambios[c])]);
}
async function eliminarServicio(db, id) {
	await db.query("UPDATE servicios SET eliminado_en = now() WHERE id = $1 AND eliminado_en IS NULL", [id]);
}
var aContacto = (c) => ({
	id: String(c.id),
	servicio_id: String(c.servicio_id),
	usuario_id: String(c.usuario_id),
	respondido: Boolean(c.respondido),
	atendido: c.atendido === null || c.atendido === void 0 ? null : Boolean(c.atendido),
	creado_en: iso(c.creado_en),
	actualizado_en: iso(c.actualizado_en)
});
async function contactoAbierto(db, servicioId, usuarioId) {
	const [c] = await db.query("SELECT * FROM contactos WHERE servicio_id = $1 AND usuario_id = $2 AND NOT respondido", [servicioId, usuarioId]);
	return c ? aContacto(c) : null;
}
async function obtenerContacto(db, id) {
	const [c] = await db.query("SELECT * FROM contactos WHERE id = $1", [id]);
	return c ? aContacto(c) : null;
}
async function crearContacto(db, id, servicioId, usuarioId) {
	const [c] = await db.query("INSERT INTO contactos (id, servicio_id, usuario_id) VALUES ($1, $2, $3) RETURNING *", [
		id,
		servicioId,
		usuarioId
	]);
	return aContacto(c);
}
async function responderContacto(db, id, atendido) {
	const [c] = await db.query("UPDATE contactos SET respondido = true, atendido = $2 WHERE id = $1 RETURNING *", [id, atendido]);
	return aContacto(c);
}
async function misContactos(db, usuarioId, opciones = {}) {
	return (await db.query(`SELECT * FROM contactos WHERE usuario_id = $1
		   AND ($2::boolean IS NOT TRUE OR NOT respondido)
		   AND ($3::timestamptz IS NULL OR actualizado_en > $3)
		 ORDER BY creado_en DESC`, [
		usuarioId,
		opciones.pendientes ?? false,
		opciones.desde ?? null
	])).map(aContacto);
}
var SELECT_RECO = `
	SELECT r.*, ${colsVecino("u", "a")},
	       coalesce((SELECT array_agg(e.etiqueta ORDER BY e.etiqueta) FROM recomendacion_etiquetas e WHERE e.recomendacion_id = r.id), '{}') AS etiquetas
	  FROM recomendaciones r JOIN usuarios u ON u.id = r.usuario_id`;
var aReco = (r) => ({
	id: String(r.id),
	servicio_id: String(r.servicio_id),
	usuario_id: String(r.usuario_id),
	autor: vecino(r, "a"),
	etiquetas: r.etiquetas ?? [],
	comentario: String(r.comentario ?? ""),
	creado_en: iso(r.creado_en)
});
async function recomendacionesDeServicio(db, servicioId) {
	return (await db.query(`${SELECT_RECO} WHERE r.servicio_id = $1 ORDER BY r.creado_en DESC`, [servicioId])).map(aReco);
}
async function recomendacionesDelSector(db, sectorId, desde) {
	return (await db.query(`${SELECT_RECO} JOIN servicios s ON s.id = r.servicio_id JOIN usuarios d ON d.id = s.dueno_id
			  WHERE d.sector_id = $1 AND ($2::timestamptz IS NULL OR r.creado_en > $2) ORDER BY r.creado_en`, [sectorId, desde])).map(aReco);
}
async function obtenerRecomendacion(db, id) {
	const [r] = await db.query(`${SELECT_RECO} WHERE r.id = $1`, [id]);
	return r ? aReco(r) : null;
}
async function crearRecomendacion(db, r) {
	await db.query("INSERT INTO recomendaciones (id, servicio_id, usuario_id, comentario) VALUES ($1, $2, $3, $4)", [
		r.id,
		r.servicioId,
		r.usuarioId,
		r.comentario
	]);
	for (const e of r.etiquetas) await db.query("INSERT INTO recomendacion_etiquetas (recomendacion_id, etiqueta) VALUES ($1, $2)", [r.id, e]);
}
export { crearServicio as a, listarServicios as c, obtenerRecomendacion as d, obtenerServicio as f, responderContacto as h, crearRecomendacion as i, misContactos as l, recomendacionesDelSector as m, contactoAbierto as n, eliminarServicio as o, recomendacionesDeServicio as p, crearContacto as r, filaServicio as s, actualizarServicio as t, obtenerContacto as u };

//# sourceMappingURL=servicios.js.map