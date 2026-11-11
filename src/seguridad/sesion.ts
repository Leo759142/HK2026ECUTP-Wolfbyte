/**
 * Gestión de sesiones persistentes (IndexedDB/localStorage).
 * Sobreviven a reinicios del servidor y del cliente (fiabilidad ISO/IEC 25010).
 * - Emite token de sesión tras login válido (celular + PIN).
 * - Valida token en cada request vía cookies.
 * - Almacena rol para RBAC en hooks.server.ts.
 */

import {
	crearSesionPersistente,
	guardarSesion,
	obtenerSesionPersistente,
	obtenerSesionActivaPorUsuarioId,
	eliminarSesionPersistente,
	listarSesionesActivasPersistentes,
	type SesionPersistente
} from './sesion-persistente';

export type RolUsuario = 'admin' | 'vecino' | 'referente' | 'emprendedor' | 'coordinador';

export interface SesionData {
	token: string;
	usuarioId: string;
	celular: string;
	alias: string;
	rol: RolUsuario;
	creadoEn: number;
	expiraEn: number;
}

const TTL_MS = 10 * 60 * 1000; // 10 minutos

export function crearSesion({
	usuarioId,
	celular,
	alias,
	rol
}: {
	usuarioId: string;
	celular: string;
	alias: string;
	rol: RolUsuario;
}): SesionData {
	const s = crearSesionPersistente({ usuarioId, celular, alias, rol });
	void guardarSesion(s);
	return s as SesionData;
}

export async function obtenerSesion(usuarioId: string): Promise<SesionData | null> {
	return obtenerSesionActivaPorUsuarioId(usuarioId) as Promise<SesionData | null>;
}

export function eliminarSesion(token: string): void {
	void eliminarSesionPersistente(token);
}

export async function listarSesionesActivas(): Promise<SesionData[]> {
	return listarSesionesActivasPersistentes() as Promise<SesionData[]>;
}

export function rolPermite(rol: RolUsuario | undefined, accion: string): boolean {
	const permisos: Record<RolUsuario, string[]> = {
		admin: ['*'],
		vecino: ['consultar_directorio', 'unirse_grupo', 'pedir_favor', 'ofrecer_favor', 'dar_visto_bueno', 'reportar_emergencia', 'publicar_offline', 'consultar_anuncios'],
		referente: [
			'consultar_directorio', 'unirse_grupo', 'pedir_favor', 'ofrecer_favor', 'dar_visto_bueno', 'reportar_emergencia', 'publicar_offline',
			'aprobar_ingreso', 'rechazar_ingreso', 'moderar_contenido', 'ocultar_contenido', 'consultar_anuncios'
		],
		emprendedor: [
			'consultar_directorio', 'unirse_grupo', 'pedir_favor', 'ofrecer_favor', 'dar_visto_bueno', 'reportar_emergencia', 'publicar_offline',
			'publicar_servicio', 'gestionar_servicio', 'consultar_anuncios'
		],
		coordinador: [
			'consultar_directorio', 'unirse_grupo', 'pedir_favor', 'ofrecer_favor', 'dar_visto_bueno', 'reportar_emergencia', 'publicar_offline',
			'activar_emergencia', 'desactivar_emergencia', 'moderar_contenido', 'ocultar_contenido', 'consultar_anuncios'
		]
	};
	if (!rol) return false;
	if (rol === 'admin') return true;
	return permisos[rol]?.includes(accion) ?? false;
}
