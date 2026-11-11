/**
 * Sesiones persistentes (IndexedDB/localStorage).
 * Sobreviven a reinicios del servidor y del cliente.
 * RFC: persistencia de sesión para fiabilidad ISO/IEC 25010.
 */

import { obtenerAlmacenKV } from '../datos/almacen';

const SESIONES_KEY = 'pod:sesiones';
const TTL_MS = 10 * 60 * 1000; // 10 minutos

export type SesionPersistente = {
	token: string;
	usuarioId: string;
	celular: string;
	alias: string;
	rol: string;
	creadoEn: number;
	expiraEn: number;
};

async function leerSesiones(): Promise<SesionPersistente[]> {
	const kv = obtenerAlmacenKV();
	const raw = await kv.get<SesionPersistente[]>(SESIONES_KEY);
	return raw ?? [];
}

async function guardarSesiones(sesiones: SesionPersistente[]): Promise<void> {
	const kv = obtenerAlmacenKV();
	await kv.set(SESIONES_KEY, sesiones);
}

export function crearSesionPersistente(data: {
	usuarioId: string;
	celular: string;
	alias: string;
	rol: string;
}): SesionPersistente {
	const token = crypto.randomUUID();
	const ahora = Date.now();
	return {
		token,
		usuarioId: data.usuarioId,
		celular: data.celular,
		alias: data.alias,
		rol: data.rol,
		creadoEn: ahora,
		expiraEn: ahora + TTL_MS
	};
}

export async function guardarSesion(s: SesionPersistente): Promise<void> {
	const lista = await leerSesiones();
	const index = lista.findIndex((x) => x.token === s.token);
	if (index >= 0) lista[index] = s;
	else lista.push(s);
	await guardarSesiones(lista);
}

export async function obtenerSesionPersistente(token: string): Promise<SesionPersistente | null> {
	const lista = await leerSesiones();
	const s = lista.find((x) => x.token === token);
	if (!s) return null;
	if (Date.now() >= s.expiraEn) {
		await eliminarSesionPersistente(token);
		return null;
	}
	return s;
}

export async function obtenerSesionActivaPorUsuarioId(usuarioId: string): Promise<SesionPersistente | null> {
	const lista = await leerSesiones();
	const ahora = Date.now();
	const activas = lista.filter((s) => s.usuarioId === usuarioId && ahora < s.expiraEn);
	if (activas.length === 0) return null;
	activas.sort((a, b) => b.creadoEn - a.creadoEn);
	return activas[0];
}

export async function eliminarSesionPersistente(token: string): Promise<void> {
	const lista = await leerSesiones();
	const filtrada = lista.filter((x) => x.token !== token);
	await guardarSesiones(filtrada);
}

export async function limpiarSesionesExpiradas(): Promise<void> {
	const ahora = Date.now();
	const lista = await leerSesiones();
	const activas = lista.filter((s) => ahora < s.expiraEn);
	await guardarSesiones(activas);
}

export async function listarSesionesActivasPersistentes(): Promise<SesionPersistente[]> {
	const ahora = Date.now();
	const lista = await leerSesiones();
	return lista.filter((s) => ahora < s.expiraEn);
}
