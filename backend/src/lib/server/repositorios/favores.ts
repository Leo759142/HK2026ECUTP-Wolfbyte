/** Repositorio de la Cadena de Favores, reportes y moderación. */
import type { Consulta } from '../db/index.ts';
import { colsVecino, iso, json, RESERVA_MS, vecino, type VecinoPublico } from '../dto.ts';

export interface FavorDto {
	id: string;
	tipo: 'pido' | 'presto' | 'regalo' | 'intercambio';
	titulo: string;
	detalles: Record<string, string>;
	foto: string | null;
	dueno_id: string;
	dueno: VecinoPublico | null;
	estado: 'disponible' | 'reservado' | 'cerrado';
	moderacion: 'visible' | 'en_revision' | 'oculto';
	tomador_id: string | null;
	tomador: VecinoPublico | null;
	reservado_en: string | null;
	minutos_restantes: number | null;
	dueno_confirmo: boolean;
	tomador_confirmo: boolean;
	cerrado_en: string | null;
	creado_en: string;
	actualizado_en: string;
	eliminado_en: string | null;
	whatsapp_url?: string | null;
}

const SELECT_FAVOR = `
	SELECT f.*, ${colsVecino('d', 'd')}, ${colsVecino('t', 't')}
	  FROM favores f JOIN usuarios d ON d.id = f.dueno_id LEFT JOIN usuarios t ON t.id = f.tomador_id`;

function aDto(f: Record<string, unknown>): FavorDto {
	const reservado = f.reservado_en ? new Date(String(f.reservado_en instanceof Date ? f.reservado_en.toISOString() : f.reservado_en)) : null;
	return {
		id: String(f.id),
		tipo: f.tipo as FavorDto['tipo'],
		titulo: String(f.titulo),
		detalles: json(f.detalles, {}),
		foto: (f.foto as string) ?? null,
		dueno_id: String(f.dueno_id),
		dueno: vecino(f, 'd'),
		estado: f.estado as FavorDto['estado'],
		moderacion: f.moderacion as FavorDto['moderacion'],
		tomador_id: (f.tomador_id as string) ?? null,
		tomador: vecino(f, 't'),
		reservado_en: iso(f.reservado_en),
		minutos_restantes:
			f.estado === 'reservado' && reservado ? Math.max(0, Math.ceil((RESERVA_MS - (Date.now() - reservado.getTime())) / 60000)) : null,
		dueno_confirmo: Boolean(f.dueno_confirmo),
		tomador_confirmo: Boolean(f.tomador_confirmo),
		cerrado_en: iso(f.cerrado_en),
		creado_en: iso(f.creado_en) as string,
		actualizado_en: iso(f.actualizado_en) as string,
		eliminado_en: iso(f.eliminado_en)
	};
}

/** Un favor reservado que no se concreta en 1 hora vuelve a estar disponible (regla del frontend). */
export async function liberarReservasVencidas(db: Consulta): Promise<number> {
	const r = await db.query(
		`UPDATE favores SET estado = 'disponible', tomador_id = NULL, reservado_en = NULL, dueno_confirmo = false, tomador_confirmo = false
		  WHERE estado = 'reservado' AND reservado_en < now() - interval '1 hour' RETURNING id`
	);
	return r.length;
}

export interface FiltroFavores {
	sectorId: string;
	yo: string;
	tipo?: string | null;
	estado?: string | null;
	mios?: boolean;
	todos?: boolean;
	desde?: Date | null;
}

export async function listarFavores(db: Consulta, f: FiltroFavores): Promise<FavorDto[]> {
	const cond = ['d.sector_id = $1'];
	const p: unknown[] = [f.sectorId, f.yo];
	if (!f.todos) {
		cond.push('f.eliminado_en IS NULL');
		// Visibles para todos; ocultos solo para su dueño. Cerrados solo para quienes participaron.
		cond.push(`(f.moderacion = 'visible' OR f.dueno_id = $2)`);
		cond.push(`(f.estado <> 'cerrado' OR f.dueno_id = $2 OR f.tomador_id = $2)`);
	}
	if (f.mios) cond.push('(f.dueno_id = $2 OR f.tomador_id = $2)');
	if (f.tipo) cond.push(`f.tipo = $${p.push(f.tipo)}`);
	if (f.estado) cond.push(`f.estado = $${p.push(f.estado)}`);
	if (f.desde) cond.push(`f.actualizado_en > $${p.push(f.desde)}`);
	const filas = await db.query<Record<string, unknown>>(
		`${SELECT_FAVOR} WHERE ${cond.join(' AND ')} AND $2::uuid IS NOT NULL ORDER BY f.creado_en DESC`,
		p
	);
	return filas.map(aDto);
}

export async function obtenerFavor(db: Consulta, id: string): Promise<(FavorDto & { sector_id: string }) | null> {
	const [f] = await db.query<Record<string, unknown>>(`${SELECT_FAVOR.replace('SELECT f.*,', 'SELECT f.*, d.sector_id AS sector_id,')} WHERE f.id = $1`, [id]);
	return f ? { ...aDto(f), sector_id: String(f.sector_id) } : null;
}

export async function crearFavor(
	db: Consulta,
	f: { id: string; duenoId: string; tipo: string; titulo: string; detalles: Record<string, string>; foto: string | null }
): Promise<boolean> {
	const r = await db.query(
		`INSERT INTO favores (id, dueno_id, tipo, titulo, detalles, foto) VALUES ($1, $2, $3, $4, $5, $6)
		 ON CONFLICT (id) DO NOTHING RETURNING id`,
		[f.id, f.duenoId, f.tipo, f.titulo, JSON.stringify(f.detalles), f.foto]
	);
	return r.length > 0;
}

export async function actualizarFavor(db: Consulta, id: string, c: { titulo?: string; detalles?: Record<string, string>; foto?: string | null }): Promise<void> {
	const sets: string[] = [];
	const p: unknown[] = [id];
	if (c.titulo !== undefined) sets.push(`titulo = $${p.push(c.titulo)}`);
	if (c.detalles !== undefined) sets.push(`detalles = $${p.push(JSON.stringify(c.detalles))}`);
	if (c.foto !== undefined) sets.push(`foto = $${p.push(c.foto)}`);
	if (!sets.length) return;
	await db.query(`UPDATE favores SET ${sets.join(', ')} WHERE id = $1`, p);
}

export async function eliminarFavor(db: Consulta, id: string): Promise<void> {
	await db.query('UPDATE favores SET eliminado_en = now() WHERE id = $1 AND eliminado_en IS NULL', [id]);
}

/** Reserva atómica: solo gana si el favor sigue disponible ("gana el primero"). */
export async function reservarFavor(db: Consulta, id: string, tomadorId: string): Promise<boolean> {
	const r = await db.query(
		`UPDATE favores SET estado = 'reservado', tomador_id = $2, reservado_en = now(), dueno_confirmo = false, tomador_confirmo = false
		  WHERE id = $1 AND estado = 'disponible' AND eliminado_en IS NULL AND moderacion = 'visible' AND dueno_id <> $2
		  RETURNING id`,
		[id, tomadorId]
	);
	return r.length > 0;
}

export async function liberarFavor(db: Consulta, id: string): Promise<boolean> {
	const r = await db.query(
		`UPDATE favores SET estado = 'disponible', tomador_id = NULL, reservado_en = NULL, dueno_confirmo = false, tomador_confirmo = false
		  WHERE id = $1 AND estado = 'reservado' RETURNING id`,
		[id]
	);
	return r.length > 0;
}

/** Marca "Listo" de un lado; si el otro ya confirmó, el favor queda cerrado. */
export async function confirmarLado(db: Consulta, id: string, lado: 'dueno' | 'tomador'): Promise<boolean> {
	const col = lado === 'dueno' ? 'dueno_confirmo' : 'tomador_confirmo';
	const otro = lado === 'dueno' ? 'tomador_confirmo' : 'dueno_confirmo';
	const r = await db.query(
		`UPDATE favores SET ${col} = true,
		        estado = CASE WHEN ${otro} THEN 'cerrado' ELSE estado END,
		        cerrado_en = CASE WHEN ${otro} THEN now() ELSE cerrado_en END
		  WHERE id = $1 AND estado = 'reservado' RETURNING id`,
		[id]
	);
	return r.length > 0;
}

/* ------------------------------------------------------- moderación */
export const MOTIVOS = ['estafa', 'falso', 'ofensivo', 'mala_experiencia', 'otro'] as const;

export interface ReporteDto {
	id: string;
	objeto_tipo: 'servicio' | 'favor';
	objeto_id: string;
	usuario_id: string;
	motivo: string;
	creado_en: string;
}

export async function crearReporte(db: Consulta, r: { id: string; tipo: 'servicio' | 'favor'; objetoId: string; usuarioId: string; motivo: string }): Promise<boolean> {
	const filas = await db.query(
		`INSERT INTO reportes (id, servicio_id, favor_id, usuario_id, motivo) VALUES ($1, $2, $3, $4, $5)
		 ON CONFLICT (id) DO NOTHING RETURNING id`,
		[r.id, r.tipo === 'servicio' ? r.objetoId : null, r.tipo === 'favor' ? r.objetoId : null, r.usuarioId, r.motivo]
	);
	return filas.length > 0;
}

export async function misReportes(db: Consulta, usuarioId: string): Promise<ReporteDto[]> {
	const filas = await db.query<Record<string, unknown>>('SELECT * FROM reportes WHERE usuario_id = $1 ORDER BY creado_en DESC', [usuarioId]);
	return filas.map((r) => ({
		id: String(r.id),
		objeto_tipo: r.servicio_id ? 'servicio' : 'favor',
		objeto_id: String(r.servicio_id ?? r.favor_id),
		usuario_id: String(r.usuario_id),
		motivo: String(r.motivo),
		creado_en: iso(r.creado_en) as string
	}));
}

export interface PendienteModeracion {
	objeto_tipo: 'servicio' | 'favor';
	objeto_id: string;
	total_reportes: number;
	titulo: string;
	descripcion: string | null;
	moderacion: string;
	dueno: VecinoPublico | null;
	motivo_principal: string;
	primer_reporte: string;
}

export async function pendientesModeracion(db: Consulta, sectorId: string): Promise<PendienteModeracion[]> {
	const filas = await db.query<Record<string, unknown>>(
		`SELECT p.objeto_id, p.objeto_tipo, p.total_reportes, p.primer_reporte,
		        coalesce(s.titulo, f.titulo) AS titulo, s.descripcion, coalesce(s.moderacion, f.moderacion) AS moderacion,
		        ${colsVecino('u', 'd')},
		        (SELECT r.motivo FROM reportes r WHERE r.decision IS NULL AND (r.servicio_id = p.objeto_id OR r.favor_id = p.objeto_id)
		          GROUP BY r.motivo ORDER BY count(*) DESC, r.motivo LIMIT 1) AS motivo_principal
		   FROM v_reportes_pendientes p
		   LEFT JOIN servicios s ON p.objeto_tipo = 'servicio' AND s.id = p.objeto_id
		   LEFT JOIN favores f ON p.objeto_tipo = 'favor' AND f.id = p.objeto_id
		   JOIN usuarios u ON u.id = coalesce(s.dueno_id, f.dueno_id)
		  WHERE u.sector_id = $1 AND coalesce(s.eliminado_en, f.eliminado_en) IS NULL
		  ORDER BY p.primer_reporte`,
		[sectorId]
	);
	return filas.map((f) => ({
		objeto_tipo: f.objeto_tipo as 'servicio' | 'favor',
		objeto_id: String(f.objeto_id),
		total_reportes: Number(f.total_reportes),
		titulo: String(f.titulo ?? ''),
		descripcion: (f.descripcion as string) ?? null,
		moderacion: String(f.moderacion),
		dueno: vecino(f, 'd'),
		motivo_principal: String(f.motivo_principal ?? 'otro'),
		primer_reporte: iso(f.primer_reporte) as string
	}));
}

export async function resolverModeracion(db: Consulta, tipo: 'servicio' | 'favor', objetoId: string, guardianId: string, decision: 'aprobar' | 'ocultar'): Promise<void> {
	const col = tipo === 'servicio' ? 'servicio_id' : 'favor_id';
	await db.query(
		`UPDATE reportes SET decision = $2, resuelto_por = $3, resuelto_en = now() WHERE ${col} = $1 AND decision IS NULL`,
		[objetoId, decision === 'aprobar' ? 'aprobado' : 'ocultado', guardianId]
	);
	const tabla = tipo === 'servicio' ? 'servicios' : 'favores';
	await db.query(`UPDATE ${tabla} SET moderacion = $2 WHERE id = $1`, [objetoId, decision === 'aprobar' ? 'visible' : 'oculto']);
}
