import { a as json, i as iso, n as colsVecino, s as vecino } from "./dto.js";
// src/lib/server/repositorios/sectores.ts
async function filas(db, where, params) {
	return (await db.query(`SELECT s.*,
		        coalesce((SELECT array_agg(m.letra::text ORDER BY m.letra) FROM sector_manzanas m WHERE m.sector_id = s.id), '{}') AS manzanas,
		        (SELECT count(*)::int FROM usuarios u WHERE u.sector_id = s.id) AS total_vecinos
		   FROM sectores s ${where} ORDER BY s.nombre`, params)).map((s) => ({
		id: String(s.id),
		nombre: String(s.nombre),
		manzanas: s.manzanas.map((x) => x.trim()),
		area_geojson: json(s.area_geojson, null),
		fundador_id: s.fundador_id ?? null,
		total_vecinos: Number(s.total_vecinos ?? 0),
		creado_en: iso(s.creado_en),
		actualizado_en: iso(s.actualizado_en)
	}));
}
var listarSectores = (db) => filas(db, "", []);
async function guardianesDe(db, sectorId) {
	return (await db.query(`SELECT ${colsVecino("u", "v")} FROM sector_guardianes g JOIN usuarios u ON u.id = g.usuario_id
		  WHERE g.sector_id = $1 ORDER BY g.desde`, [sectorId])).map((r) => vecino(r, "v"));
}
async function obtenerSector(db, id, conGuardianes = true) {
	const [s] = await filas(db, "WHERE s.id = $1", [id]);
	if (!s) return null;
	if (conGuardianes) s.guardianes = await guardianesDe(db, id);
	return s;
}
async function sectoresCambiados(db, sectorId, desde) {
	const lista = await filas(db, "WHERE s.id = $1 AND ($2::timestamptz IS NULL OR s.actualizado_en > $2 OR s.creado_en > $2)", [sectorId, desde]);
	for (const s of lista) s.guardianes = await guardianesDe(db, s.id);
	return lista;
}
async function existeManzana(db, sectorId, letra) {
	return (await db.query("SELECT 1 FROM sector_manzanas WHERE sector_id = $1 AND letra = $2", [sectorId, letra])).length > 0;
}
async function crearSector(db, s) {
	await db.query("INSERT INTO sectores (id, nombre, area_geojson) VALUES ($1, $2, $3)", [
		s.id,
		s.nombre,
		s.area ? JSON.stringify(s.area) : null
	]);
	for (const m of s.manzanas) await db.query("INSERT INTO sector_manzanas (sector_id, letra) VALUES ($1, $2)", [s.id, m]);
}
async function fijarFundador(db, sectorId, usuarioId) {
	await db.query("UPDATE sectores SET fundador_id = $2 WHERE id = $1", [sectorId, usuarioId]);
	await db.query("INSERT INTO sector_guardianes (sector_id, usuario_id, es_fundador) VALUES ($1, $2, true)", [sectorId, usuarioId]);
}
async function agregarGuardian(db, sectorId, usuarioId) {
	await db.query("INSERT INTO sector_guardianes (sector_id, usuario_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [sectorId, usuarioId]);
}
async function quitarGuardian(db, sectorId, usuarioId) {
	await db.query("DELETE FROM sector_guardianes WHERE sector_id = $1 AND usuario_id = $2 AND NOT es_fundador", [sectorId, usuarioId]);
}
/** ¿El punto está dentro del polígono GeoJSON del sector? (ray casting, suficiente para un barrio). */
function dentro(lat, lng, area) {
	const geom = (area?.type === "Feature" ? area.geometry : area) ?? null;
	if (!geom || geom.type !== "Polygon") return false;
	const anillo = geom.coordinates?.[0];
	if (!Array.isArray(anillo)) return false;
	let adentro = false;
	for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
		const [xi, yi] = anillo[i];
		const [xj, yj] = anillo[j];
		if (yi > lat !== yj > lat && lng < (xj - xi) * (lat - yi) / (yj - yi) + xi) adentro = !adentro;
	}
	return adentro;
}
async function sectorPorUbicacion(db, lat, lng) {
	return (await listarSectores(db)).find((s) => dentro(lat, lng, s.area_geojson)) ?? null;
}
export { listarSectores as a, sectorPorUbicacion as c, fijarFundador as i, sectoresCambiados as l, crearSector as n, obtenerSector as o, existeManzana as r, quitarGuardian as s, agregarGuardian as t };

//# sourceMappingURL=sectores.js.map