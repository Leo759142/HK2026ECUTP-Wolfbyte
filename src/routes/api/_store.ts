/**
 * Almacén en memoria compartido por los endpoints de la API (demo, sin base de datos).
 * Vive fuera de los +server.ts porque SvelteKit solo permite exportar handlers (GET, POST, ...) ahí.
 * Se pierde al reiniciar el servidor.
 */
import type { Favor, FavorConfirmacion } from '../../dominio/tipos/tipos';

export type Fila = Record<string, unknown>;

export interface StoreApi {
	favores: Favor[];
	confirmaciones: FavorConfirmacion[];
	servicios: Fila[];
	recomendaciones: Fila[];
	alertas: Fila[];
	emergencias: Fila[];
	usuarios: Fila[];
	sesiones: Fila[];
	grupos: Fila[];
	membresias: Fila[];
	puntoApoyo: Fila[];
	alertasOficiales: Fila[];
	anuncios: Fila[];
	notificaciones: Fila[];
}

/** Ids de demo: u4 pidió el favor f2 y u2 lo está ayudando. */
export const USUARIOS_DEMO = { solicitante: 'u4', ayudante: 'u2' } as const;

function semillaFavores(): Favor[] {
	const ahora = new Date().toISOString();
	return [
		{
			id: 'f1',
			zona_id: 'z1',
			tipo: 'necesidad',
			categoria: 'prestamo_herramienta',
			titulo: 'Préstamo de escalera',
			descripcion: 'Necesito escalera de 3m por 2 días.',
			creador_id: 'u1',
			ayudante_id: null,
			estado: 'abierto',
			oculto: 0,
			agradecimiento: null,
			cerrado_en: null,
			lat_aprox: -12.046,
			lng_aprox: -77.043,
			creado_en: ahora
		},
		{
			id: 'f2',
			zona_id: 'z1',
			tipo: 'necesidad',
			categoria: 'movilidad',
			titulo: 'Acompañamiento a cita médica',
			descripcion: 'Adulto mayor necesita acompañante.',
			creador_id: USUARIOS_DEMO.solicitante,
			ayudante_id: USUARIOS_DEMO.ayudante,
			estado: 'en_curso',
			oculto: 0,
			agradecimiento: null,
			cerrado_en: null,
			lat_aprox: -12.046,
			lng_aprox: -77.043,
			creado_en: ahora
		}
	];
}

function semillaServicios(): Fila[] {
	const ahora = new Date().toISOString();
	return [
		{
			id: 's1',
			zona_id: 'z1',
			categoria: 'gasfiteria',
			titulo: 'Gasfitero 24h',
			descripcion: 'Reparación de fugas y desagües.',
			lat_aprox: -12.05,
			lng_aprox: -77.04,
			usuario_id: 'u2',
			es_emprendimiento: 1,
			activo: 1,
			oculto: 0,
			creado_en: ahora,
			actualizado_en: ahora
		},
		{
			id: 's2',
			zona_id: 'z1',
			categoria: 'costura',
			titulo: 'Costurera del barrio',
			descripcion: 'Arreglos y confección.',
			lat_aprox: -12.051,
			lng_aprox: -77.041,
			usuario_id: 'u3',
			es_emprendimiento: 1,
			activo: 1,
			oculto: 0,
			creado_en: ahora,
			actualizado_en: ahora
		}
	];
}

export const store: StoreApi = {
	favores: semillaFavores(),
	confirmaciones: [],
	servicios: semillaServicios(),
	recomendaciones: [],
	alertas: [],
	emergencias: [],
	usuarios: semillaUsuarios(),
	sesiones: [],
	grupos: semillaGrupos(),
	membresias: [],
	puntoApoyo: [],
	alertasOficiales: [],
	anuncios: [],
	notificaciones: []
};

/** Vuelve al estado inicial (útil en tests). */
export function reiniciarStore(): void {
	store.favores = semillaFavores();
	store.confirmaciones = [];
	store.servicios = semillaServicios();
	store.recomendaciones = [];
	store.alertas = [];
	store.emergencias = [];
	store.usuarios = semillaUsuarios();
	store.sesiones = [];
	store.grupos = semillaGrupos();
	store.membresias = [];
	store.puntoApoyo = [];
	store.alertasOficiales = [];
	store.anuncios = [];
	store.notificaciones = [];
}

function semillaUsuarios(): Fila[] {
	const ahora = new Date().toISOString();
	return [
		{
			id: 'u-admin',
			celular: '999000000',
			alias: 'admin',
			rol: 'admin',
			activo: 1,
			creado_en: ahora
		},
		{
			id: 'u-vecino',
			celular: '999111111',
			alias: 'rosa',
			rol: 'vecino',
			activo: 1,
			creado_en: ahora
		},
		{
			id: 'u-referente',
			celular: '999222222',
			alias: 'delegada',
			rol: 'referente',
			activo: 1,
			creado_en: ahora
		},
		{
			id: 'u-coordinador',
			celular: '999333333',
			alias: 'lider',
			rol: 'coordinador',
			activo: 1,
			creado_en: ahora
		},
		{
			id: 'u-emprendedor',
			celular: '999444444',
			alias: 'bodeguero',
			rol: 'emprendedor',
			activo: 1,
			creado_en: ahora
		}
	];
}

function semillaGrupos(): Fila[] {
	const ahora = new Date().toISOString();
	return [
		{
			id: 'g-zona-1',
			nombre: 'Los Jardines - Manzana B',
			zona_id: 'z1',
			tipo: 'manzana',
			creador_id: 'u-referente',
			activo: 1,
			creado_en: ahora
		}
	];
}
