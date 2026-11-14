/** Validación de entrada. Cada función lanza un 422 con un mensaje para el vecino. */
import { err } from './http.ts';

export type Cuerpo = Record<string, unknown>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const esUuid = (v: unknown): v is string => typeof v === 'string' && UUID.test(v);

export function uuid(v: unknown, campo: string): string {
	if (!esUuid(v)) throw err.invalido(`${campo} debe ser un identificador válido (UUID).`);
	return v.toLowerCase();
}

export function uuidOpcional(v: unknown, campo: string): string | null {
	return v === undefined || v === null || v === '' ? null : uuid(v, campo);
}

interface ReglaTexto {
	min?: number;
	max?: number;
	opcional?: boolean;
}

export function texto(v: unknown, campo: string, r: ReglaTexto = {}): string {
	if (v === undefined || v === null) {
		if (r.opcional) return '';
		throw err.invalido(`Falta ${campo}.`);
	}
	if (typeof v !== 'string') throw err.invalido(`${campo} debe ser texto.`);
	const t = v.trim();
	if (r.min !== undefined && t.length < r.min) throw err.invalido(`${campo} debe tener al menos ${r.min} caracteres.`);
	if (r.max !== undefined && t.length > r.max) throw err.invalido(`${campo} no puede superar ${r.max} caracteres.`);
	return t;
}

export function textoONull(v: unknown, campo: string, r: ReglaTexto = {}): string | null {
	if (v === undefined || v === null) return null;
	const t = texto(v, campo, { ...r, opcional: true });
	return t === '' ? null : t;
}

export function opcion<T extends string>(v: unknown, campo: string, opciones: readonly T[]): T {
	if (typeof v !== 'string' || !opciones.includes(v as T)) {
		throw err.invalido(`${campo} debe ser uno de: ${opciones.join(', ')}.`);
	}
	return v as T;
}

export function booleano(v: unknown, campo: string): boolean {
	if (typeof v !== 'boolean') throw err.invalido(`${campo} debe ser verdadero o falso.`);
	return v;
}

export function entero(v: unknown, campo: string, min: number, max: number): number {
	if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) {
		throw err.invalido(`${campo} debe ser un número entre ${min} y ${max}.`);
	}
	return v;
}

export function telefono(v: unknown): string {
	const t = typeof v === 'string' ? v.replace(/\D/g, '') : '';
	const completo = t.length === 9 ? `51${t}` : t;
	if (!/^519\d{8}$/.test(completo)) throw err.invalido('El celular debe tener 9 dígitos y empezar con 9.', 'TELEFONO_INVALIDO');
	return completo;
}

export function manzana(v: unknown): string {
	if (typeof v !== 'string' || !/^[A-J]$/.test(v)) throw err.invalido('La manzana debe ser una letra de la A a la J.');
	return v;
}

/** Coordenadas aproximadas: se guardan con 3 decimales (~100 m), nunca la ubicación exacta. */
export function coordenada(v: unknown, campo: string, limite: number): number | null {
	if (v === undefined || v === null) return null;
	if (typeof v !== 'number' || !Number.isFinite(v) || Math.abs(v) > limite) {
		throw err.invalido(`${campo} no es una coordenada válida.`);
	}
	return Math.round(v * 1000) / 1000;
}

/** Foto opcional: URL https o imagen JPEG/PNG/WebP en data-URL comprimida (≤ 480 px en el cliente). */
export function foto(v: unknown): string | null {
	if (v === undefined || v === null || v === '') return null;
	if (typeof v !== 'string') throw err.invalido('La foto no es válida.');
	const esDataUrl = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(v);
	const esUrl = /^https:\/\/[^\s]+$/.test(v);
	if (!esDataUrl && !esUrl) throw err.invalido('La foto debe ser una imagen JPEG, PNG o WebP.');
	if (v.length > 400_000) throw err.invalido('La foto es muy pesada. Elige otra o tómala de nuevo.');
	return v;
}

/** Objeto de textos cortos (detalles de un favor). */
export function detalles(v: unknown): Record<string, string> {
	if (v === undefined || v === null) return {};
	if (typeof v !== 'object' || Array.isArray(v)) throw err.invalido('Los detalles no son válidos.');
	const out: Record<string, string> = {};
	for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
		if (!/^[a-z_]{1,30}$/.test(k)) throw err.invalido('Los detalles tienen un campo no válido.');
		if (val === null || val === undefined) continue;
		if (typeof val !== 'string' || val.length > 200) throw err.invalido('Cada detalle debe ser un texto corto.');
		out[k] = val.trim();
	}
	return out;
}

export function fechaIso(v: unknown, campo: string): Date | null {
	if (v === undefined || v === null) return null;
	const d = typeof v === 'string' || typeof v === 'number' ? new Date(v) : null;
	if (!d || Number.isNaN(d.getTime())) throw err.invalido(`${campo} debe ser una fecha válida.`);
	return d;
}

export function listaUnica<T extends string>(v: unknown, campo: string, opciones: readonly T[], min: number, max: number): T[] {
	if (!Array.isArray(v)) throw err.invalido(`${campo} debe ser una lista.`);
	const unicos = [...new Set(v)];
	if (unicos.length < min || unicos.length > max) throw err.invalido(`${campo}: elige entre ${min} y ${max}.`);
	return unicos.map((x) => opcion(x, campo, opciones));
}
