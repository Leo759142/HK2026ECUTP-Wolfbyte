/**
 * Gestión de sesiones en memoria (puente hasta DB real).
 * - Emite token de sesión tras login válido (celular + PIN).
 * - Valida token en cada request vía cookies.
 * - Almacena rol para RBAC en hooks.server.ts.
 */

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

const sesiones = new Map<string, SesionData>();
const TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

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
	const token = crypto.randomUUID();
	const ahora = Date.now();
	const sesion: SesionData = {
		token,
		usuarioId,
		celular,
		alias,
		rol,
		creadoEn: ahora,
		expiraEn: ahora + TTL_MS
	};
	sesiones.set(token, sesion);
	return sesion;
}

export function obtenerSesion(token: string): SesionData | null {
	const s = sesiones.get(token);
	if (!s) return null;
	if (Date.now() >= s.expiraEn) {
		sesiones.delete(token);
		return null;
	}
	return s;
}

export function eliminarSesion(token: string): void {
	sesiones.delete(token);
}

export function listarSesionesActivas(): SesionData[] {
	const ahora = Date.now();
	const activas: SesionData[] = [];
	for (const s of sesiones.values()) {
		if (ahora < s.expiraEn) activas.push(s);
	}
	return activas;
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