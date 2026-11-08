import type { RolMembresia } from '../tipos/tipos';

export type AccionRbac =
	| 'consultar_directorio'
	| 'unirse_grupo'
	| 'pedir_favor'
	| 'ofrecer_favor'
	| 'dar_visto_bueno'
	| 'reportar_emergencia'
	| 'publicar_offline'
	| 'publicar_servicio'
	| 'gestionar_servicio'
	| 'aprobar_ingreso'
	| 'rechazar_ingreso'
	| 'moderar_contenido'
	| 'ocultar_contenido'
	| 'activar_emergencia'
	| 'desactivar_emergencia';

export const PERMISOS_POR_ROL_MEMBRESIA: Record<RolMembresia, readonly AccionRbac[]> = {
	vecino: [
		'consultar_directorio',
		'unirse_grupo',
		'pedir_favor',
		'ofrecer_favor',
		'dar_visto_bueno',
		'reportar_emergencia',
		'publicar_offline'
	],
	referente: [
		'consultar_directorio',
		'unirse_grupo',
		'pedir_favor',
		'ofrecer_favor',
		'dar_visto_bueno',
		'reportar_emergencia',
		'publicar_offline',
		'aprobar_ingreso',
		'rechazar_ingreso',
		'moderar_contenido',
		'ocultar_contenido'
	],
	emprendedor: [
		'consultar_directorio',
		'unirse_grupo',
		'pedir_favor',
		'ofrecer_favor',
		'dar_visto_bueno',
		'reportar_emergencia',
		'publicar_offline',
		'publicar_servicio',
		'gestionar_servicio'
	],
	coordinador: [
		'consultar_directorio',
		'unirse_grupo',
		'pedir_favor',
		'ofrecer_favor',
		'dar_visto_bueno',
		'reportar_emergencia',
		'publicar_offline',
		'activar_emergencia',
		'desactivar_emergencia',
		'moderar_contenido',
		'ocultar_contenido'
	]
};

export function puede(rol: RolMembresia, accion: AccionRbac): boolean {
	return PERMISOS_POR_ROL_MEMBRESIA[rol]?.includes(accion) ?? false;
}

// Compatibilidad con modelo UI anterior (roles humanizados)
export type Rol =
	| 'Vecino'
	| 'Referente de manzana'
	| 'Emprendedor'
	| 'Coordinador de emergencia'
	| 'Anunciante'
	| 'Cualquiera';

export type Accion = AccionRbac | 'publicar_anuncio';

const MAPA_ROL_UI: Partial<Record<Rol, RolMembresia>> = {
	Vecino: 'vecino',
	'Referente de manzana': 'referente',
	Emprendedor: 'emprendedor',
	'Coordinador de emergencia': 'coordinador'
};

export const PERMISOS_POR_ROL: Record<Rol, readonly Accion[]> = {
	Cualquiera: ['consultar_directorio'],
	Anunciante: ['consultar_directorio', 'publicar_anuncio'],
	Vecino: PERMISOS_POR_ROL_MEMBRESIA.vecino,
	'Referente de manzana': PERMISOS_POR_ROL_MEMBRESIA.referente,
	Emprendedor: PERMISOS_POR_ROL_MEMBRESIA.emprendedor,
	'Coordinador de emergencia': PERMISOS_POR_ROL_MEMBRESIA.coordinador
};

export function puedeRol(rol: Rol, accion: Accion): boolean {
	if (rol === 'Cualquiera') return accion === 'consultar_directorio';
	if (rol === 'Anunciante')
		return accion === 'consultar_directorio' || accion === 'publicar_anuncio';
	const mapeado = MAPA_ROL_UI[rol];
	return mapeado ? puede(mapeado, accion as AccionRbac) : false;
}
