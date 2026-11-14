/** Repositorio de servicios/productos, contactos ("¿Te atendió?") y Vistos Buenos. */
import type { Consulta } from '../db/index.ts';
import { colsVecino, cuadras, iso, json, vecino, type VecinoPublico } from '../dto.ts';

export interface ServicioDto {
	id: string;
	clase: 'servicio' | 'producto';
	categoria: string;
	titulo: string;
	descripcion: string;
	horario: string;
	precio: string | null;
	foto: string | null;
	mostrar_nombre_completo: boolean;
	dueno_id: string;
	dueno: VecinoPublico | null;
	estado: 'disponible' | 'pausado';
	moderacion: 'visible' | 'en_revision' | 'oculto';
	total_vistos_buenos: number;
	vistos_base: number;
	etiquetas_base: Record<string, number>;
	etiquetas: Array<{ etiqueta: string; cantidad: number }>;
	distancia_cuadras: number;
	creado_en: string;
	actualizado_en: string;
	eliminado_en: string | null;
}

const SELECT_SERVICIO = `
	SELECT s.*, ${colsVecino('u', 'd')},
	       (SELECT count(*)::int FROM recomendaciones r WHERE r.servicio_id = s.id) AS recos,
	       (SELECT coalesce(jsonb_object_agg(e.etiqueta, e.cantidad), '{}'::jsonb) FROM v_servicio_etiquetas e WHERE e.servicio_id = s.id) AS etiquetas_reco
	  FROM servicios s JOIN usuarios u ON u.id = s.dueno_id`;

function aDto(f: Record<string, unknown>, miManzana: string | null): ServicioDto {
	const base = json<Record<string, number>>(f.etiquetas_base, {});
	const reco = json<Record<string, number>>(f.etiquetas_reco, {});
	const total: Record<string, number> = { ...base };
	for (const [k, v] of Object.entries(reco)) total[k] = (total[k] ?? 0) + Number(v);
	const dueno = vecino(f, 'd', Boolean(f.mostrar_nombre_completo));
	return {
		id: String(f.id),
		clase: f.clase as ServicioDto['clase'],
		categoria: String(f.categoria),
		titulo: String(f.titulo),
		descripcion: String(f.descripcion),
		horario: String(f.horario),
		precio: (f.precio as string) ?? null,
		foto: (f.foto as string) ?? null,
		mostrar_nombre_completo: Boolean(f.mostrar_nombre_completo),
		dueno_id: String(f.dueno_id),
		dueno,
		estado: f.estado as ServicioDto['estado'],
		moderacion: f.moderacion as ServicioDto['moderacion'],
		total_vistos_buenos: Number(f.vistos_base ?? 0) + Number(f.recos ?? 0),
		vistos_base: Number(f.vistos_base ?? 0),
		etiquetas_base: base,
		etiquetas: Object.entries(total)
			.map(([etiqueta, cantidad]) => ({ etiqueta, cantidad: Number(cantidad) }))
			.sort((a, b) => b.cantidad - a.cantidad),
		distancia_cuadras: cuadras(miManzana, dueno?.manzana),
		creado_en: iso(f.creado_en) as string,
		actualizado_en: iso(f.actualizado_en) as string,
		eliminado_en: iso(f.eliminado_en)
	};
}

export interface FiltroServicios {
	sectorId: string;
	yo: string;
	miManzana: string;
	categoria?: string | null;
	clase?: string | null;
	q?: string | null;
	mios?: boolean;
	soloRecomendados?: boolean;
	/** Para /sync/pull: incluye ocultos y eliminados (el cliente los quita de su copia). */
	todos?: boolean;
	desde?: Date | null;
}

export async function listarServicios(db: Consulta, f: FiltroServicios): Promise<ServicioDto[]> {
	const cond = ['u.sector_id = $1'];
	const p: unknown[] = [f.sectorId, f.yo];
	if (!f.todos) {
		cond.push(`s.eliminado_en IS NULL`);
		cond.push(`((s.estado = 'disponible' AND s.moderacion = 'visible') OR (s.dueno_id = $2 AND s.moderacion <> 'oculto'))`);
	}
	if (f.mios) cond.push('s.dueno_id = $2');
	if (f.categoria) cond.push(`s.categoria = $${p.push(f.categoria)}`);
	if (f.clase) cond.push(`s.clase = $${p.push(f.clase)}`);
	if (f.q) cond.push(`(s.titulo ILIKE $${p.push(`%${f.q}%`)} OR s.descripcion ILIKE $${p.length})`);
	if (f.desde) cond.push(`s.actualizado_en > $${p.push(f.desde)}`);
	const filas = await db.query<Record<string, unknown>>(`${SELECT_SERVICIO} WHERE ${cond.join(' AND ')} AND $2::uuid IS NOT NULL`, p);
	let lista = filas.map((x) => aDto(x, f.miManzana));
	if (f.soloRecomendados) lista = lista.filter((s) => s.total_vistos_buenos > 0);
	return lista;
}

export async function obtenerServicio(db: Consulta, id: string, miManzana: string | null): Promise<ServicioDto | null> {
	const [f] = await db.query<Record<string, unknown>>(`${SELECT_SERVICIO} WHERE s.id = $1`, [id]);
	return f ? aDto(f, miManzana) : null;
}

/** Fila mínima para validar permisos (dueño, sector, borrado). */
export async function filaServicio(db: Consulta, id: string) {
	const [f] = await db.query<{ id: string; dueno_id: string; sector_id: string; eliminado_en: Date | null; actualizado_en: Date; moderacion: string; estado: string }>(
		`SELECT s.id, s.dueno_id, u.sector_id, s.eliminado_en, s.actualizado_en, s.moderacion, s.estado
		   FROM servicios s JOIN usuarios u ON u.id = s.dueno_id WHERE s.id = $1`,
		[id]
	);
	return f ?? null;
}

export interface DatosServicio {
	clase: string;
	categoria: string;
	titulo: string;
	descripcion: string;
	horario: string;
	precio: string | null;
	foto: string | null;
	mostrar_nombre_completo: boolean;
}

/** Crea el servicio. Si el id ya existe (reintento), no hace nada. Devuelve true si lo creó. */
export async function crearServicio(db: Consulta, id: string, duenoId: string, d: DatosServicio): Promise<boolean> {
	const r = await db.query(
		`INSERT INTO servicios (id, dueno_id, clase, categoria, titulo, descripcion, horario, precio, foto, mostrar_nombre_completo)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (id) DO NOTHING RETURNING id`,
		[id, duenoId, d.clase, d.categoria, d.titulo, d.descripcion, d.horario, d.precio, d.foto, d.mostrar_nombre_completo]
	);
	return r.length > 0;
}

const EDITABLES = ['clase', 'categoria', 'titulo', 'descripcion', 'horario', 'precio', 'foto', 'mostrar_nombre_completo', 'estado'] as const;

export async function actualizarServicio(db: Consulta, id: string, cambios: Partial<Record<(typeof EDITABLES)[number], unknown>>): Promise<void> {
	const campos = EDITABLES.filter((c) => c in cambios);
	if (!campos.length) return;
	await db.query(`UPDATE servicios SET ${campos.map((c, i) => `${c} = $${i + 2}`).join(', ')} WHERE id = $1`, [id, ...campos.map((c) => cambios[c])]);
}

export async function eliminarServicio(db: Consulta, id: string): Promise<void> {
	await db.query('UPDATE servicios SET eliminado_en = now() WHERE id = $1 AND eliminado_en IS NULL', [id]);
}

/* ---------------------------------------------------------- contactos */
export interface ContactoDto {
	id: string;
	servicio_id: string;
	usuario_id: string;
	respondido: boolean;
	atendido: boolean | null;
	creado_en: string;
	actualizado_en: string | null;
	whatsapp_url?: string | null;
}

const aContacto = (c: Record<string, unknown>): ContactoDto => ({
	id: String(c.id),
	servicio_id: String(c.servicio_id),
	usuario_id: String(c.usuario_id),
	respondido: Boolean(c.respondido),
	atendido: c.atendido === null || c.atendido === undefined ? null : Boolean(c.atendido),
	creado_en: iso(c.creado_en) as string,
	actualizado_en: iso(c.actualizado_en)
});

export async function contactoAbierto(db: Consulta, servicioId: string, usuarioId: string): Promise<ContactoDto | null> {
	const [c] = await db.query<Record<string, unknown>>('SELECT * FROM contactos WHERE servicio_id = $1 AND usuario_id = $2 AND NOT respondido', [servicioId, usuarioId]);
	return c ? aContacto(c) : null;
}

export async function obtenerContacto(db: Consulta, id: string): Promise<ContactoDto | null> {
	const [c] = await db.query<Record<string, unknown>>('SELECT * FROM contactos WHERE id = $1', [id]);
	return c ? aContacto(c) : null;
}

export async function crearContacto(db: Consulta, id: string, servicioId: string, usuarioId: string): Promise<ContactoDto> {
	const [c] = await db.query<Record<string, unknown>>(
		'INSERT INTO contactos (id, servicio_id, usuario_id) VALUES ($1, $2, $3) RETURNING *',
		[id, servicioId, usuarioId]
	);
	return aContacto(c);
}

export async function responderContacto(db: Consulta, id: string, atendido: boolean): Promise<ContactoDto> {
	const [c] = await db.query<Record<string, unknown>>('UPDATE contactos SET respondido = true, atendido = $2 WHERE id = $1 RETURNING *', [id, atendido]);
	return aContacto(c);
}

export async function misContactos(db: Consulta, usuarioId: string, opciones: { pendientes?: boolean; desde?: Date | null } = {}): Promise<ContactoDto[]> {
	const filas = await db.query<Record<string, unknown>>(
		`SELECT * FROM contactos WHERE usuario_id = $1
		   AND ($2::boolean IS NOT TRUE OR NOT respondido)
		   AND ($3::timestamptz IS NULL OR actualizado_en > $3)
		 ORDER BY creado_en DESC`,
		[usuarioId, opciones.pendientes ?? false, opciones.desde ?? null]
	);
	return filas.map(aContacto);
}

/* ------------------------------------------------------ recomendaciones */
export interface RecomendacionDto {
	id: string;
	servicio_id: string;
	usuario_id: string;
	autor: VecinoPublico | null;
	etiquetas: string[];
	comentario: string;
	creado_en: string;
}

const SELECT_RECO = `
	SELECT r.*, ${colsVecino('u', 'a')},
	       coalesce((SELECT array_agg(e.etiqueta ORDER BY e.etiqueta) FROM recomendacion_etiquetas e WHERE e.recomendacion_id = r.id), '{}') AS etiquetas
	  FROM recomendaciones r JOIN usuarios u ON u.id = r.usuario_id`;

const aReco = (r: Record<string, unknown>): RecomendacionDto => ({
	id: String(r.id),
	servicio_id: String(r.servicio_id),
	usuario_id: String(r.usuario_id),
	autor: vecino(r, 'a'),
	etiquetas: (r.etiquetas as string[]) ?? [],
	comentario: String(r.comentario ?? ''),
	creado_en: iso(r.creado_en) as string
});

export async function recomendacionesDeServicio(db: Consulta, servicioId: string): Promise<RecomendacionDto[]> {
	return (await db.query<Record<string, unknown>>(`${SELECT_RECO} WHERE r.servicio_id = $1 ORDER BY r.creado_en DESC`, [servicioId])).map(aReco);
}

export async function recomendacionesDelSector(db: Consulta, sectorId: string, desde: Date | null): Promise<RecomendacionDto[]> {
	return (
		await db.query<Record<string, unknown>>(
			`${SELECT_RECO} JOIN servicios s ON s.id = r.servicio_id JOIN usuarios d ON d.id = s.dueno_id
			  WHERE d.sector_id = $1 AND ($2::timestamptz IS NULL OR r.creado_en > $2) ORDER BY r.creado_en`,
			[sectorId, desde]
		)
	).map(aReco);
}

export async function obtenerRecomendacion(db: Consulta, id: string): Promise<RecomendacionDto | null> {
	const [r] = await db.query<Record<string, unknown>>(`${SELECT_RECO} WHERE r.id = $1`, [id]);
	return r ? aReco(r) : null;
}

export async function crearRecomendacion(db: Consulta, r: { id: string; servicioId: string; usuarioId: string; etiquetas: string[]; comentario: string }): Promise<void> {
	await db.query('INSERT INTO recomendaciones (id, servicio_id, usuario_id, comentario) VALUES ($1, $2, $3, $4)', [r.id, r.servicioId, r.usuarioId, r.comentario]);
	for (const e of r.etiquetas) await db.query('INSERT INTO recomendacion_etiquetas (recomendacion_id, etiqueta) VALUES ($1, $2)', [r.id, e]);
}
