/** Repositorio de sectores, manzanas y Guardianes. */
import type { Consulta } from '../db/index.ts';
import { colsVecino, iso, json, vecino, type VecinoPublico } from '../dto.ts';

export interface SectorDto {
	id: string;
	nombre: string;
	manzanas: string[];
	guardianes?: VecinoPublico[];
	area_geojson: Record<string, unknown> | null;
	fundador_id: string | null;
	total_vecinos: number;
	creado_en: string | null;
	actualizado_en: string | null;
}

async function filas(db: Consulta, where: string, params: unknown[]): Promise<SectorDto[]> {
	const rows = await db.query<Record<string, unknown>>(
		`SELECT s.*,
		        coalesce((SELECT array_agg(m.letra::text ORDER BY m.letra) FROM sector_manzanas m WHERE m.sector_id = s.id), '{}') AS manzanas,
		        (SELECT count(*)::int FROM usuarios u WHERE u.sector_id = s.id) AS total_vecinos
		   FROM sectores s ${where} ORDER BY s.nombre`,
		params
	);
	return rows.map((s) => ({
		id: String(s.id),
		nombre: String(s.nombre),
		manzanas: (s.manzanas as string[]).map((x) => x.trim()),
		area_geojson: json(s.area_geojson, null),
		fundador_id: (s.fundador_id as string) ?? null,
		total_vecinos: Number(s.total_vecinos ?? 0),
		creado_en: iso(s.creado_en),
		actualizado_en: iso(s.actualizado_en)
	}));
}

export const listarSectores = (db: Consulta) => filas(db, '', []);

export async function guardianesDe(db: Consulta, sectorId: string): Promise<VecinoPublico[]> {
	const rows = await db.query<Record<string, unknown>>(
		`SELECT ${colsVecino('u', 'v')} FROM sector_guardianes g JOIN usuarios u ON u.id = g.usuario_id
		  WHERE g.sector_id = $1 ORDER BY g.desde`,
		[sectorId]
	);
	return rows.map((r) => vecino(r, 'v') as VecinoPublico);
}

export async function obtenerSector(db: Consulta, id: string, conGuardianes = true): Promise<SectorDto | null> {
	const [s] = await filas(db, 'WHERE s.id = $1', [id]);
	if (!s) return null;
	if (conGuardianes) s.guardianes = await guardianesDe(db, id);
	return s;
}

export async function sectoresCambiados(db: Consulta, sectorId: string, desde: Date | null): Promise<SectorDto[]> {
	const lista = await filas(db, 'WHERE s.id = $1 AND ($2::timestamptz IS NULL OR s.actualizado_en > $2 OR s.creado_en > $2)', [sectorId, desde]);
	for (const s of lista) s.guardianes = await guardianesDe(db, s.id);
	return lista;
}

export async function existeManzana(db: Consulta, sectorId: string, letra: string): Promise<boolean> {
	const r = await db.query('SELECT 1 FROM sector_manzanas WHERE sector_id = $1 AND letra = $2', [sectorId, letra]);
	return r.length > 0;
}

export async function crearSector(
	db: Consulta,
	s: { id: string; nombre: string; manzanas: string[]; area: Record<string, unknown> | null }
): Promise<void> {
	await db.query('INSERT INTO sectores (id, nombre, area_geojson) VALUES ($1, $2, $3)', [s.id, s.nombre, s.area ? JSON.stringify(s.area) : null]);
	for (const m of s.manzanas) await db.query('INSERT INTO sector_manzanas (sector_id, letra) VALUES ($1, $2)', [s.id, m]);
}

export async function fijarFundador(db: Consulta, sectorId: string, usuarioId: string): Promise<void> {
	await db.query('UPDATE sectores SET fundador_id = $2 WHERE id = $1', [sectorId, usuarioId]);
	await db.query('INSERT INTO sector_guardianes (sector_id, usuario_id, es_fundador) VALUES ($1, $2, true)', [sectorId, usuarioId]);
}

export async function agregarGuardian(db: Consulta, sectorId: string, usuarioId: string): Promise<void> {
	await db.query('INSERT INTO sector_guardianes (sector_id, usuario_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [sectorId, usuarioId]);
}

export async function quitarGuardian(db: Consulta, sectorId: string, usuarioId: string): Promise<void> {
	await db.query('DELETE FROM sector_guardianes WHERE sector_id = $1 AND usuario_id = $2 AND NOT es_fundador', [sectorId, usuarioId]);
}

/** ¿El punto está dentro del polígono GeoJSON del sector? (ray casting, suficiente para un barrio). */
function dentro(lat: number, lng: number, area: Record<string, unknown> | null): boolean {
	const geom = (area?.type === 'Feature' ? (area.geometry as Record<string, unknown>) : area) ?? null;
	if (!geom || geom.type !== 'Polygon') return false;
	const anillo = (geom.coordinates as number[][][])?.[0];
	if (!Array.isArray(anillo)) return false;
	let adentro = false;
	for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
		const [xi, yi] = anillo[i];
		const [xj, yj] = anillo[j];
		if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) adentro = !adentro;
	}
	return adentro;
}

export async function sectorPorUbicacion(db: Consulta, lat: number, lng: number): Promise<SectorDto | null> {
	const todos = await listarSectores(db);
	return todos.find((s) => dentro(lat, lng, s.area_geojson)) ?? null;
}
