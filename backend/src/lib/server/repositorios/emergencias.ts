/** Repositorio del modo emergencia: emergencias, confirmaciones, acuses, pedidos de ayuda y grupos de apoyo. */
import type { Consulta } from '../db/index.ts';
import { colsVecino, iso, vecino, type VecinoPublico } from '../dto.ts';

export interface EmergenciaDto {
	id: string;
	tipo: string;
	texto: string;
	foto: string | null;
	sector_id: string;
	reportero_id: string;
	reportero: VecinoPublico | null;
	manzana: string;
	estado: 'pendiente' | 'activa' | 'descartada' | 'atendida';
	confirmada_por: string | null;
	confirmada_en: string | null;
	motivo_descarte: string | null;
	revisada_por: string | null;
	revisada_en: string | null;
	atendida_en: string | null;
	cerrada_por: string | null;
	reportero_visto: boolean;
	vence_en: string | null;
	confirmaciones: { actuales: number; requeridas: number };
	mi_respuesta: 'visto' | 'bien' | 'ayuda' | null;
	fin_visto: boolean;
	resumen?: Record<string, number>;
	creado_en: string;
	actualizado_en: string;
}

const SELECT_EMERGENCIA = `
	SELECT e.*, ${colsVecino('u', 'r')},
	       (SELECT count(*)::int FROM emergencia_confirmaciones c WHERE c.emergencia_id = e.id) AS n_confirmaciones,
	       a.respuesta AS mi_respuesta, coalesce(a.fin_visto, false) AS mi_fin_visto,
	       greatest(e.actualizado_en, (SELECT max(x.actualizado_en) FROM emergencia_acuses x WHERE x.emergencia_id = e.id),
	                (SELECT max(p.actualizado_en) FROM pedidos_ayuda p WHERE p.emergencia_id = e.id)) AS cambio
	  FROM emergencias e
	  JOIN usuarios u ON u.id = e.reportero_id
	  LEFT JOIN emergencia_acuses a ON a.emergencia_id = e.id AND a.usuario_id = $1`;

async function resumen(db: Consulta, id: string): Promise<Record<string, number>> {
	const [r] = await db.query<Record<string, unknown>>('SELECT * FROM v_emergencia_resumen WHERE emergencia_id = $1', [id]);
	const out: Record<string, number> = {};
	for (const k of ['pedidos_total', 'pedidos_resueltos', 'pedidos_sin_atender', 'vecinos_ayudando', 'a_salvo', 'necesitan_ayuda', 'vecinos_avisados']) {
		out[k] = Number(r?.[k] ?? 0);
	}
	return out;
}

function aDto(f: Record<string, unknown>, requeridas: number): EmergenciaDto {
	return {
		id: String(f.id),
		tipo: String(f.tipo),
		texto: String(f.texto ?? ''),
		foto: (f.foto as string) ?? null,
		sector_id: String(f.sector_id),
		reportero_id: String(f.reportero_id),
		reportero: vecino(f, 'r'),
		manzana: String(f.manzana).trim(),
		estado: f.estado as EmergenciaDto['estado'],
		confirmada_por: (f.confirmada_por as string) ?? null,
		confirmada_en: iso(f.confirmada_en),
		motivo_descarte: (f.motivo_descarte as string) ?? null,
		revisada_por: (f.revisada_por as string) ?? null,
		revisada_en: iso(f.revisada_en),
		atendida_en: iso(f.atendida_en),
		cerrada_por: (f.cerrada_por as string) ?? null,
		reportero_visto: Boolean(f.reportero_visto),
		vence_en: iso(f.vence_en),
		confirmaciones: { actuales: Number(f.n_confirmaciones ?? 0), requeridas },
		mi_respuesta: (f.mi_respuesta as EmergenciaDto['mi_respuesta']) ?? null,
		fin_visto: Boolean(f.mi_fin_visto),
		creado_en: iso(f.creado_en) as string,
		actualizado_en: iso(f.cambio ?? f.actualizado_en) as string
	};
}

export interface ContextoLector {
	usuarioId: string;
	sectorId: string;
	esGuardian: boolean;
	requeridas: number;
}

/**
 * Emergencias que puede ver el usuario: el Guardián ve todas las de su sector (incluidas las pendientes);
 * el vecino ve las activas/atendidas y las que él mismo reportó.
 */
export async function listarEmergencias(db: Consulta, c: ContextoLector, filtro: { estado?: string | null; desde?: Date | null; id?: string } = {}): Promise<EmergenciaDto[]> {
	const p: unknown[] = [c.usuarioId, c.sectorId];
	const cond = ['e.sector_id = $2'];
	if (!c.esGuardian) cond.push(`(e.estado IN ('activa','atendida') OR e.reportero_id = $1)`);
	if (filtro.estado) cond.push(`e.estado = $${p.push(filtro.estado)}`);
	if (filtro.id) cond.push(`e.id = $${p.push(filtro.id)}`);
	let sql = `${SELECT_EMERGENCIA} WHERE ${cond.join(' AND ')}`;
	if (filtro.desde) sql = `SELECT * FROM (${sql}) q WHERE q.cambio > $${p.push(filtro.desde)}`;
	const filas = await db.query<Record<string, unknown>>(`${sql} ORDER BY creado_en DESC`, p);
	const lista = filas.map((f) => aDto(f, c.requeridas));
	if (c.esGuardian) for (const e of lista) e.resumen = await resumen(db, e.id);
	return lista;
}

export async function obtenerEmergencia(db: Consulta, c: ContextoLector, id: string): Promise<EmergenciaDto | null> {
	const [e] = await listarEmergencias(db, c, { id });
	return e ?? null;
}

export async function filaEmergencia(db: Consulta, id: string) {
	const [e] = await db.query<{ id: string; sector_id: string; estado: string; reportero_id: string }>(
		'SELECT id, sector_id, estado, reportero_id FROM emergencias WHERE id = $1',
		[id]
	);
	return e ?? null;
}

export async function crearEmergencia(
	db: Consulta,
	e: { id: string; sectorId: string; reporteroId: string; tipo: string; texto: string; foto: string | null; manzana: string }
): Promise<boolean> {
	const r = await db.query(
		`INSERT INTO emergencias (id, sector_id, reportero_id, tipo, texto, foto, manzana) VALUES ($1, $2, $3, $4, $5, $6, $7)
		 ON CONFLICT (id) DO NOTHING RETURNING id`,
		[e.id, e.sectorId, e.reporteroId, e.tipo, e.texto, e.foto, e.manzana]
	);
	return r.length > 0;
}

export async function registrarConfirmacion(db: Consulta, emergenciaId: string, guardianId: string): Promise<number> {
	await db.query('INSERT INTO emergencia_confirmaciones (emergencia_id, guardian_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [emergenciaId, guardianId]);
	const [{ n }] = await db.query<{ n: number }>('SELECT count(*)::int AS n FROM emergencia_confirmaciones WHERE emergencia_id = $1', [emergenciaId]);
	return n;
}

export async function activarEmergencia(db: Consulta, id: string, guardianId: string): Promise<void> {
	await db.query(
		`UPDATE emergencias SET estado = 'activa', confirmada_por = $2, confirmada_en = now() WHERE id = $1 AND estado = 'pendiente'`,
		[id, guardianId]
	);
}

export async function descartarEmergencia(db: Consulta, id: string, guardianId: string, motivo: string): Promise<boolean> {
	const r = await db.query(
		`UPDATE emergencias SET estado = 'descartada', revisada_por = $2, revisada_en = now(), motivo_descarte = $3
		  WHERE id = $1 AND estado = 'pendiente' RETURNING id`,
		[id, guardianId, motivo]
	);
	return r.length > 0;
}

export async function atenderEmergencia(db: Consulta, id: string, guardianId: string): Promise<boolean> {
	const r = await db.query(
		`UPDATE emergencias SET estado = 'atendida', atendida_en = now(), cerrada_por = $2 WHERE id = $1 AND estado = 'activa' RETURNING id`,
		[id, guardianId]
	);
	return r.length > 0;
}

export async function guardarAcuse(db: Consulta, emergenciaId: string, usuarioId: string, a: { respuesta?: string | null; fin_visto?: boolean }): Promise<void> {
	await db.query(
		`INSERT INTO emergencia_acuses (emergencia_id, usuario_id, respuesta, fin_visto) VALUES ($1, $2, $3, coalesce($4, false))
		 ON CONFLICT (emergencia_id, usuario_id) DO UPDATE
		   SET respuesta = coalesce(EXCLUDED.respuesta, emergencia_acuses.respuesta),
		       fin_visto = coalesce($4, emergencia_acuses.fin_visto)`,
		[emergenciaId, usuarioId, a.respuesta ?? null, a.fin_visto ?? null]
	);
}

export async function marcarReporteroVisto(db: Consulta, id: string): Promise<void> {
	await db.query('UPDATE emergencias SET reportero_visto = true WHERE id = $1', [id]);
}

/* -------------------------------------------------------- pedidos */
export interface PedidoDto {
	id: string;
	emergencia_id: string;
	necesidad: string;
	vulnerables: string[];
	cuantas: number;
	texto: string;
	foto: string | null;
	dueno_id: string;
	dueno: VecinoPublico | null;
	manzana: string;
	estado: 'abierto' | 'en_camino' | 'resuelto';
	ayudante_id: string | null;
	ayudante: VecinoPublico | null;
	ayudante_en: string | null;
	resuelto_en: string | null;
	contacto_telefono: string | null;
	direccion_exacta: { distrito: string | null; direccion: string | null; referencia: string | null; lat_aprox: number | null; lng_aprox: number | null } | null;
	creado_en: string;
	actualizado_en: string;
}

export async function listarPedidos(
	db: Consulta,
	c: { usuarioId: string; sectorId: string; esGuardian: boolean },
	filtro: { emergenciaId?: string; id?: string; desde?: Date | null } = {}
): Promise<PedidoDto[]> {
	const p: unknown[] = [c.sectorId];
	const cond = ['e.sector_id = $1'];
	if (filtro.emergenciaId) cond.push(`p.emergencia_id = $${p.push(filtro.emergenciaId)}`);
	if (filtro.id) cond.push(`p.id = $${p.push(filtro.id)}`);
	if (filtro.desde) cond.push(`p.actualizado_en > $${p.push(filtro.desde)}`);
	const filas = await db.query<Record<string, unknown>>(
		`SELECT p.*, e.estado AS estado_emergencia, ${colsVecino('d', 'd')}, ${colsVecino('h', 'h')},
		        d.telefono AS tel_dueno, h.telefono AS tel_ayudante,
		        d.distrito AS d_distrito, d.direccion AS d_direccion, d.referencia AS d_referencia, d.lat_aprox AS d_lat, d.lng_aprox AS d_lng,
		        coalesce((SELECT array_agg(v.grupo ORDER BY v.grupo) FROM pedido_vulnerables v WHERE v.pedido_id = p.id), '{}') AS vulnerables
		   FROM pedidos_ayuda p
		   JOIN emergencias e ON e.id = p.emergencia_id
		   JOIN usuarios d ON d.id = p.dueno_id
		   LEFT JOIN usuarios h ON h.id = p.ayudante_id
		  WHERE ${cond.join(' AND ')} ORDER BY p.creado_en DESC`,
		p
	);
	return filas.map((f) => {
		const soyDueno = f.dueno_id === c.usuarioId;
		const soyAyudante = f.ayudante_id === c.usuarioId;
		const aceptado = f.estado !== 'abierto' && f.ayudante_id;
		// Privacidad: el teléfono solo lo ven quien pidió y quien va en camino, una vez aceptado.
		const telefono = aceptado ? (soyDueno ? f.tel_ayudante : soyAyudante ? f.tel_dueno : null) : null;
		// La dirección exacta solo la ven los Guardianes mientras la emergencia está activa.
		const verDireccion = c.esGuardian && f.estado_emergencia === 'activa';
		return {
			id: String(f.id),
			emergencia_id: String(f.emergencia_id),
			necesidad: String(f.necesidad),
			vulnerables: (f.vulnerables as string[]) ?? [],
			cuantas: Number(f.cuantas),
			texto: String(f.texto ?? ''),
			foto: (f.foto as string) ?? null,
			dueno_id: String(f.dueno_id),
			dueno: vecino(f, 'd'),
			manzana: String(f.manzana).trim(),
			estado: f.estado as PedidoDto['estado'],
			ayudante_id: (f.ayudante_id as string) ?? null,
			ayudante: vecino(f, 'h'),
			ayudante_en: iso(f.ayudante_en),
			resuelto_en: iso(f.resuelto_en),
			contacto_telefono: (telefono as string) ?? null,
			direccion_exacta: verDireccion
				? {
						distrito: (f.d_distrito as string) ?? null,
						direccion: (f.d_direccion as string) ?? null,
						referencia: (f.d_referencia as string) ?? null,
						lat_aprox: f.d_lat === null ? null : Number(f.d_lat),
						lng_aprox: f.d_lng === null ? null : Number(f.d_lng)
					}
				: null,
			creado_en: iso(f.creado_en) as string,
			actualizado_en: iso(f.actualizado_en) as string
		};
	});
}

export async function filaPedido(db: Consulta, id: string) {
	const [p] = await db.query<{ id: string; dueno_id: string; estado: string; ayudante_id: string | null; sector_id: string; estado_emergencia: string }>(
		`SELECT p.id, p.dueno_id, p.estado, p.ayudante_id, e.sector_id, e.estado AS estado_emergencia
		   FROM pedidos_ayuda p JOIN emergencias e ON e.id = p.emergencia_id WHERE p.id = $1`,
		[id]
	);
	return p ?? null;
}

export async function crearPedido(
	db: Consulta,
	p: { id: string; emergenciaId: string; duenoId: string; necesidad: string; cuantas: number; texto: string; foto: string | null; manzana: string; vulnerables: string[] }
): Promise<boolean> {
	const r = await db.query(
		`INSERT INTO pedidos_ayuda (id, emergencia_id, dueno_id, necesidad, cuantas, texto, foto, manzana)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING RETURNING id`,
		[p.id, p.emergenciaId, p.duenoId, p.necesidad, p.cuantas, p.texto, p.foto, p.manzana]
	);
	if (!r.length) return false;
	for (const g of p.vulnerables) await db.query('INSERT INTO pedido_vulnerables (pedido_id, grupo) VALUES ($1, $2)', [p.id, g]);
	return true;
}

export async function ayudarPedido(db: Consulta, id: string, ayudanteId: string): Promise<boolean> {
	const r = await db.query(
		`UPDATE pedidos_ayuda SET estado = 'en_camino', ayudante_id = $2, ayudante_en = now()
		  WHERE id = $1 AND estado = 'abierto' AND dueno_id <> $2 RETURNING id`,
		[id, ayudanteId]
	);
	return r.length > 0;
}

export async function resolverPedido(db: Consulta, id: string): Promise<void> {
	await db.query(`UPDATE pedidos_ayuda SET estado = 'resuelto', resuelto_en = now() WHERE id = $1 AND estado <> 'resuelto'`, [id]);
}

/* -------------------------------------------------------- grupos */
export interface GrupoDto {
	id: string;
	sector_id: string;
	emoji: string;
	nombre: string;
	meta: string;
	recurso: string | null;
	manzana: string | null;
	contacto_tipo: 'tel' | 'wa';
	contacto_valor: string;
	creado_en: string;
}

export async function listarGrupos(db: Consulta, sectorId: string, filtro: { recurso?: string | null; desde?: Date | null } = {}): Promise<GrupoDto[]> {
	const filas = await db.query<Record<string, unknown>>(
		`SELECT * FROM grupos_apoyo WHERE sector_id = $1 AND ($2::text IS NULL OR recurso = $2)
		   AND ($3::timestamptz IS NULL OR creado_en > $3) ORDER BY creado_en, nombre`,
		[sectorId, filtro.recurso ?? null, filtro.desde ?? null]
	);
	return filas.map((g) => ({
		id: String(g.id),
		sector_id: String(g.sector_id),
		emoji: String(g.emoji),
		nombre: String(g.nombre),
		meta: String(g.meta ?? ''),
		recurso: (g.recurso as string) ?? null,
		manzana: g.manzana ? String(g.manzana).trim() : null,
		contacto_tipo: g.contacto_tipo as 'tel' | 'wa',
		contacto_valor: String(g.contacto_valor),
		creado_en: iso(g.creado_en) as string
	}));
}
