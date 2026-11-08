/** Validación de entrada compartida por los endpoints (lista blanca, textos y coordenadas). */
import { problem } from './_http';

export type Cuerpo = Record<string, unknown>;

/** Lee el body como objeto JSON plano, o devuelve un 400. */
export async function leerObjeto(request: Request): Promise<Cuerpo | Response> {
	const b = await request.json().catch(() => null);
	if (!b || typeof b !== 'object' || Array.isArray(b))
		return problem(400, 'JSON inválido', 'El cuerpo debe ser un objeto JSON.');
	return b as Cuerpo;
}

/** Copia solo los campos permitidos (lista blanca). Los textos se recortan. */
export function elegir(b: Cuerpo, campos: readonly string[]): Cuerpo {
	const out: Cuerpo = {};
	for (const c of campos) {
		if (!(c in b) || b[c] === undefined) continue;
		const v = b[c];
		out[c] = typeof v === 'string' ? v.trim() : v;
	}
	return out;
}

export interface ReglaTexto {
	min?: number;
	max: number;
	requerido?: boolean;
}

/** Devuelve el primer error de texto encontrado, o null si todo está bien. */
export function errorTextos(b: Cuerpo, reglas: Record<string, ReglaTexto>): string | null {
	for (const [campo, r] of Object.entries(reglas)) {
		const v = b[campo];
		const requerido = r.requerido ?? true;
		if (v === undefined || v === null || v === '') {
			if (requerido) return `${campo} es requerido.`;
			continue;
		}
		if (typeof v !== 'string') return `${campo} debe ser texto.`;
		const largo = v.trim().length;
		const min = r.min ?? (requerido ? 1 : 0);
		if (largo < min) return `${campo} debe tener al menos ${min} caracteres.`;
		if (largo > r.max) return `${campo} no puede superar ${r.max} caracteres.`;
	}
	return null;
}

function aNumero(v: unknown): number {
	if (typeof v === 'number') return v;
	if (typeof v === 'string' && v.trim() !== '') return Number(v);
	return Number.NaN;
}

/** true si lat/lng son números finitos dentro de rango. */
export function coordenadasValidas(lat: number, lng: number): boolean {
	return (
		Number.isFinite(lat) &&
		Number.isFinite(lng) &&
		lat >= -90 &&
		lat <= 90 &&
		lng >= -180 &&
		lng <= 180
	);
}

/**
 * Lee lat_aprox/lng_aprox del body.
 * - null: no vinieron (y no son obligatorias).
 * - Response 422: inválidas, incompletas o faltantes siendo obligatorias.
 */
export function leerCoordenadas(
	b: Cuerpo,
	requeridas: boolean
): { lat: number; lng: number } | null | Response {
	const tieneLat = b.lat_aprox !== undefined && b.lat_aprox !== null;
	const tieneLng = b.lng_aprox !== undefined && b.lng_aprox !== null;
	if (!tieneLat && !tieneLng) {
		return requeridas
			? problem(422, 'Coordenadas requeridas', 'Incluye lat_aprox y lng_aprox.')
			: null;
	}
	const lat = aNumero(b.lat_aprox);
	const lng = aNumero(b.lng_aprox);
	if (!tieneLat || !tieneLng || !coordenadasValidas(lat, lng)) {
		return problem(
			422,
			'Coordenadas inválidas',
			'lat_aprox debe estar entre -90 y 90 y lng_aprox entre -180 y 180.'
		);
	}
	return { lat, lng };
}

export const esRespuesta = (v: unknown): v is Response => v instanceof Response;

/** Valida la representación de foto definida por los esquemas: URL o data-URL comprimida. */
export function validarFoto(v: unknown): string | null {
	if (v === undefined || v === null || v === '') return null;
	if (typeof v !== 'string') return 'foto debe ser texto.';
	if (v.length > 400_000) return 'foto no puede superar 400 KB.';
	if (
		!v.startsWith('data:image/jpeg;base64,') &&
		!v.startsWith('data:image/png;base64,') &&
		!v.startsWith('data:image/webp;base64,') &&
		!/^https?:\/\//i.test(v)
	) {
		return 'foto debe ser una URL o una imagen data-URL JPEG, PNG o WebP.';
	}
	return null;
}
