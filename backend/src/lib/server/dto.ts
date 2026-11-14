/**
 * Conversión fila de PostgreSQL → DTO del contrato (static/api/openapi.yaml).
 * Aquí viven las reglas de privacidad de lo que se devuelve:
 * - Nunca se listan teléfonos ni direcciones de otros vecinos.
 * - "Rosa M." salvo que el vecino (o su servicio) elija mostrar el nombre completo.
 */
type F = Record<string, unknown>;

export const iso = (v: unknown): string | null => {
	if (v === null || v === undefined) return null;
	const d = v instanceof Date ? v : new Date(String(v));
	return Number.isNaN(d.getTime()) ? null : d.toISOString();
};
export const num = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));
export const json = <T>(v: unknown, def: T): T => {
	if (v === null || v === undefined) return def;
	if (typeof v === 'string') {
		try {
			return JSON.parse(v) as T;
		} catch {
			return def;
		}
	}
	return v as T;
};

/** Igual que util.nombreVisible del frontend. */
export function nombreVisible(nombre: string, apellido: string, completo: boolean): string {
	const a = (apellido ?? '').trim();
	if (completo) return `${nombre} ${a}`.trim();
	return a ? `${nombre} ${a[0]}.` : nombre;
}

/** Columnas de un vecino con prefijo, para usar en SELECT ... JOIN usuarios <alias>. */
export function colsVecino(alias: string, p: string): string {
	return `${alias}.id AS ${p}_id, ${alias}.nombre AS ${p}_nombre, ${alias}.apellido AS ${p}_apellido,
		${alias}.manzana AS ${p}_manzana, ${alias}.foto AS ${p}_foto, ${alias}.mostrar_nombre_completo AS ${p}_completo,
		${alias}.creado_en AS ${p}_creado,
		EXISTS (SELECT 1 FROM sector_guardianes g_${p} WHERE g_${p}.usuario_id = ${alias}.id AND g_${p}.sector_id = ${alias}.sector_id) AS ${p}_guardian`;
}

export interface VecinoPublico {
	id: string;
	nombre: string;
	nombre_visible: string;
	manzana: string;
	foto: string | null;
	es_guardian: boolean;
	mostrar_nombre_completo: boolean;
	creado_en: string | null;
}

export function vecino(f: F, p: string, forzarCompleto = false): VecinoPublico | null {
	if (!f[`${p}_id`]) return null;
	const completo = Boolean(f[`${p}_completo`]) || forzarCompleto;
	return {
		id: String(f[`${p}_id`]),
		nombre: String(f[`${p}_nombre`]),
		nombre_visible: nombreVisible(String(f[`${p}_nombre`]), String(f[`${p}_apellido`] ?? ''), completo),
		manzana: String(f[`${p}_manzana`]),
		foto: (f[`${p}_foto`] as string) ?? null,
		es_guardian: Boolean(f[`${p}_guardian`]),
		mostrar_nombre_completo: Boolean(f[`${p}_completo`]),
		creado_en: iso(f[`${p}_creado`])
	};
}

/** Distancia aproximada en cuadras según la letra de la manzana (util.cuadras del frontend). */
export function cuadras(a: string | null | undefined, b: string | null | undefined): number {
	if (!a || !b) return 1;
	return Math.abs(a.charCodeAt(0) - b.charCodeAt(0));
}

export function whatsappUrl(telefono: string, texto: string): string {
	return `https://wa.me/${telefono.replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`;
}

export const RESERVA_MS = 60 * 60 * 1000;
export const DIAS_PARA_GUARDIAN = 60;
