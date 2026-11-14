/** Repositorio de usuarios (tabla usuarios + vistas v_balance_ayni / v_vecino_stats). */
import type { Consulta } from '../db/index.ts';
import { colsVecino, DIAS_PARA_GUARDIAN, iso, num, vecino, type VecinoPublico } from '../dto.ts';

const DIA = 24 * 60 * 60 * 1000;

export interface UsuarioDto {
	id: string;
	nombre: string;
	apellido: string;
	telefono: string;
	sector_id: string;
	manzana: string;
	lat_aprox: number | null;
	lng_aprox: number | null;
	foto: string | null;
	distrito: string | null;
	direccion: string | null;
	referencia: string | null;
	verificado: boolean;
	mostrar_nombre_completo: boolean;
	invitacion_guardian: 'aceptada' | 'despues' | 'fundador' | null;
	idioma: 'es' | 'en' | 'qu';
	letra_grande: boolean;
	rol_plataforma: 'usuario' | 'admin';
	es_guardian: boolean;
	dias_en_ayni: number;
	camino_guardian: {
		dias_en_ayni: number;
		dias_requeridos: number;
		vistos_buenos_actuales: number;
		vistos_buenos_requeridos: number;
		elegible: boolean;
	};
	creado_en: string;
	actualizado_en: string;
}

export const diasDesde = (fecha: unknown) => Math.max(0, Math.floor((Date.now() - new Date(String(fecha instanceof Date ? fecha.toISOString() : fecha)).getTime()) / DIA));

/** Mi cuenta completa (solo para el propio usuario: incluye teléfono y dirección). */
export async function obtenerUsuario(db: Consulta, id: string): Promise<UsuarioDto | null> {
	const [u] = await db.query<Record<string, unknown>>(
		`SELECT u.*,
		        EXISTS (SELECT 1 FROM sector_guardianes g WHERE g.usuario_id = u.id AND g.sector_id = u.sector_id) AS es_guardian,
		        coalesce((SELECT vistos_buenos FROM v_vecino_stats v WHERE v.usuario_id = u.id), 0) AS vistos
		   FROM usuarios u WHERE u.id = $1`,
		[id]
	);
	if (!u) return null;
	const dias = diasDesde(u.creado_en);
	const requeridos = Number(process.env.VISTOS_BUENOS_PARA_GUARDIAN ?? 0);
	const vistos = Number(u.vistos ?? 0);
	return {
		id: String(u.id),
		nombre: String(u.nombre),
		apellido: String(u.apellido ?? ''),
		telefono: String(u.telefono),
		sector_id: String(u.sector_id),
		manzana: String(u.manzana),
		lat_aprox: num(u.lat_aprox),
		lng_aprox: num(u.lng_aprox),
		foto: (u.foto as string) ?? null,
		distrito: (u.distrito as string) ?? null,
		direccion: (u.direccion as string) ?? null,
		referencia: (u.referencia as string) ?? null,
		verificado: Boolean(u.verificado),
		mostrar_nombre_completo: Boolean(u.mostrar_nombre_completo),
		invitacion_guardian: (u.invitacion_guardian as UsuarioDto['invitacion_guardian']) ?? null,
		idioma: u.idioma as UsuarioDto['idioma'],
		letra_grande: Boolean(u.letra_grande),
		rol_plataforma: u.rol_plataforma as UsuarioDto['rol_plataforma'],
		es_guardian: Boolean(u.es_guardian),
		dias_en_ayni: dias,
		camino_guardian: {
			dias_en_ayni: dias,
			dias_requeridos: DIAS_PARA_GUARDIAN,
			vistos_buenos_actuales: vistos,
			vistos_buenos_requeridos: requeridos,
			elegible: dias >= DIAS_PARA_GUARDIAN && vistos >= requeridos
		},
		creado_en: iso(u.creado_en) as string,
		actualizado_en: iso(u.actualizado_en) as string
	};
}

export async function idPorTelefono(db: Consulta, telefono: string): Promise<string | null> {
	const [u] = await db.query<{ id: string }>('SELECT id FROM usuarios WHERE telefono = $1', [telefono]);
	return u?.id ?? null;
}

export interface NuevoUsuario {
	id?: string;
	nombre: string;
	apellido: string;
	telefono: string;
	sectorId: string;
	manzana: string;
	lat: number | null;
	lng: number | null;
	foto: string | null;
	distrito: string | null;
	direccion: string | null;
	referencia: string | null;
	idioma: 'es' | 'en' | 'qu';
	invitacion: 'fundador' | null;
}

export async function crearUsuario(db: Consulta, u: NuevoUsuario): Promise<string> {
	const [fila] = await db.query<{ id: string }>(
		`INSERT INTO usuarios (id, nombre, apellido, telefono, sector_id, manzana, lat_aprox, lng_aprox, foto, distrito, direccion, referencia, idioma, invitacion_guardian)
		 VALUES (coalesce($1::uuid, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`,
		[u.id ?? null, u.nombre, u.apellido, u.telefono, u.sectorId, u.manzana, u.lat, u.lng, u.foto, u.distrito, u.direccion, u.referencia, u.idioma, u.invitacion]
	);
	return fila.id;
}

const EDITABLES = ['mostrar_nombre_completo', 'idioma', 'letra_grande', 'manzana', 'foto', 'distrito', 'direccion', 'referencia', 'invitacion_guardian'] as const;
export type CambiosUsuario = Partial<Record<(typeof EDITABLES)[number], unknown>>;

export async function actualizarUsuario(db: Consulta, id: string, cambios: CambiosUsuario): Promise<void> {
	const campos = EDITABLES.filter((c) => c in cambios);
	if (campos.length === 0) return;
	const sets = campos.map((c, i) => `${c} = $${i + 2}`).join(', ');
	await db.query(`UPDATE usuarios SET ${sets} WHERE id = $1`, [id, ...campos.map((c) => cambios[c])]);
}

/** Vecinos de un sector, solo con datos públicos (para mostrar quién publica, recomienda o ayuda). */
export async function vecinosDelSector(db: Consulta, sectorId: string, desde: Date | null = null): Promise<VecinoPublico[]> {
	const filas = await db.query<Record<string, unknown>>(
		`SELECT ${colsVecino('u', 'v')} FROM usuarios u
		  WHERE u.sector_id = $1 AND ($2::timestamptz IS NULL OR u.actualizado_en > $2 OR u.creado_en > $2)
		  ORDER BY u.creado_en`,
		[sectorId, desde]
	);
	return filas.map((f) => vecino(f, 'v') as VecinoPublico);
}

export async function perfilVecino(db: Consulta, id: string, sectorId: string) {
	const [f] = await db.query<Record<string, unknown>>(
		`SELECT ${colsVecino('u', 'v')}, b.dados, b.recibidos, s.publicaciones, s.vistos_buenos
		   FROM usuarios u
		   JOIN v_balance_ayni b ON b.usuario_id = u.id
		   JOIN v_vecino_stats s ON s.usuario_id = u.id
		  WHERE u.id = $1 AND u.sector_id = $2`,
		[id, sectorId]
	);
	if (!f) return null;
	return {
		...(vecino(f, 'v') as VecinoPublico),
		balance_ayni: { dados: Number(f.dados ?? 0), recibidos: Number(f.recibidos ?? 0) },
		stats: { publicaciones: Number(f.publicaciones ?? 0), vistos_buenos: Number(f.vistos_buenos ?? 0) }
	};
}

export async function telefonoDe(db: Consulta, id: string): Promise<string | null> {
	const [u] = await db.query<{ telefono: string }>('SELECT telefono FROM usuarios WHERE id = $1', [id]);
	return u?.telefono ?? null;
}
