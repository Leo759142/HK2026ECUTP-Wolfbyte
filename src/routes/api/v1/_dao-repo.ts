/**
 * Capa de acceso a datos sobre `dao.ts` (IndexedDB via AlmacenKV).
 * Unifica todas las entidades bajo una sola capa persistente, eliminando la
 * dependencia de `_store` (memoria volátil) en los endpoints de API.
 *
 * Estrategia de conflicto: **LWW (Last-Write-Wins)** por `updated_at`.
 * - Cada entidad guarda `updated_at` (ISO).
 * - Al crear/actualizar, si ya existe un registro con `updated_at` mayor o igual,
 *   no se sobrescribe (se conserva el más reciente).
 * - Esto es suficiente para offline-first sin CRDT complejo; CRDT se puede
 *   agregar como capa superior sobre este mismo repositorio si se requiere
 *   resolución de conflictos por campo (contadores, sets, etc.).
 *
 * No usa localStorage. Todo persiste en IndexedDB (o MemoriaKV en SSR/tests).
 */

import { dao } from '../../../datos/dao';

type Fila = Record<string, unknown>;

function idDe(payload: Fila): string {
	return String(payload.id ?? crypto.randomUUID());
}

function ahoraIso(): string {
	return new Date().toISOString();
}

/** Lee una entidad por id. */
export async function obtenerEntidad<T = Fila>(entidad: string, id: string): Promise<T | null> {
	return dao.obtenerLocal<T>(entidad, id);
}

/** Lista todas las filas de una entidad (con filtro opcional en memoria). */
export async function listarEntidad<T = Fila>(
	entidad: string,
	filtro?: (fila: T) => boolean
): Promise<T[]> {
	const filas = await dao.listarLocal<T>(entidad);
	if (!filtro) return filas;
	return filas.filter(filtro);
}

/** Lista paginado. */
export async function listarEntidadPaginado<T = Fila>(
	entidad: string,
	opts: { limite?: number; offset?: number },
	filtro?: (fila: T) => boolean
): Promise<{ items: T[]; total: number }> {
	const paginado = await dao.listarLocalPaginado<T>(entidad, opts);
	let items = paginado.items;
	if (filtro) items = items.filter(filtro);
	return { items, total: items.length };
}

/**
 * Crea o actualiza una entidad con LWW.
 * - Si no existe: la crea con `created_at` y `updated_at`.
 * - Si existe y el `updated_at` del payload es mayor: sobrescribe.
 * - Si existe y el `updated_at` del payload es menor o igual: ignora (gana el existente).
 */
export async function aplicarEntidadLWW(
	entidad: string,
	payload: Fila
): Promise<{ aplicada: boolean; id: string; motivo?: string }> {
	const id = idDe(payload);
	const existente = await dao.obtenerLocal<Fila>(entidad, id);
	const nuevoTs = String(payload.updated_at ?? ahoraIso());

	if (existente) {
		const existenteTs = String((existente as Fila).updated_at ?? '');
		if (nuevoTs <= existenteTs) {
			return { aplicada: false, id, motivo: 'LWW: existente más reciente o igual' };
		}
	}

	const fila: Fila = {
		...payload,
		id,
		updated_at: nuevoTs,
		created_at: existente ? (existente as Fila).created_at ?? ahoraIso() : ahoraIso()
	};
	await dao.aplicarLocal(entidad, fila);
	return { aplicada: true, id };
}

/** Crea una entidad (asume que no existe o que el caller valida unicidad). */
export async function crearEntidad(entidad: string, payload: Fila): Promise<string> {
	const id = idDe(payload);
	const fila: Fila = {
		...payload,
		id,
		created_at: ahoraIso(),
		updated_at: ahoraIso()
	};
	await dao.aplicarLocal(entidad, fila);
	return id;
}

/** Elimina una entidad por id. */
export async function eliminarEntidad(entidad: string, id: string): Promise<void> {
	await dao.eliminarLocal(entidad, id);
}

/** Borra todo el contenido de una entidad (útil en tests). */
export async function vaciarEntidad(entidad: string): Promise<void> {
	const filas = await dao.listarLocal<Fila>(entidad);
	for (const f of filas) {
		await dao.eliminarLocal(entidad, String(f.id));
	}
}