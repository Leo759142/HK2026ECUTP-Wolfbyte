/**
 * Almacén en memoria compartido por los endpoints de la API (demo, sin base de datos).
 * Vive fuera de los +server.ts porque SvelteKit solo permite exportar handlers (GET, POST, ...) ahí.
 * Se pierde al reiniciar el servidor.
 */
import type { Favor, FavorConfirmacion } from '../../dominio/tipos/tipos';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export type Fila = Record<string, unknown>;

export interface StoreApi {
	favores: Favor[];
	confirmaciones: FavorConfirmacion[];
	servicios: Fila[];
	recomendaciones: Fila[];
	alertas: Fila[];
	alertasOficiales: Fila[];
	emergencias: Fila[];
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
	alertasOficiales: [],
	emergencias: []
};

let cargado = false;
let escritura: Promise<void> = Promise.resolve();
const esPrueba = process.env.NODE_ENV === 'test';
const archivoDatos =
	process.env.AYNI_DATA_FILE ?? join(process.cwd(), 'temp', 'ayni-api-store.json');

/** Carga una vez el estado persistente del adaptador Node. En tests permanece aislado. */
export async function cargarStore(): Promise<void> {
	if (cargado || esPrueba) return;
	cargado = true;
	try {
		const raw = JSON.parse(await readFile(archivoDatos, 'utf8')) as Partial<StoreApi>;
		for (const clave of [
			'favores',
			'confirmaciones',
			'servicios',
			'recomendaciones',
			'alertas',
			'alertasOficiales',
			'emergencias'
		] as const) {
			if (Array.isArray(raw[clave])) store[clave] = raw[clave] as never;
		}
	} catch {
		// Primer arranque: se conservan las semillas iniciales.
	}
}

/** Persiste con reemplazo atómico para evitar archivos truncados ante una caída. */
export function persistirStore(): Promise<void> {
	if (esPrueba) return Promise.resolve();
	escritura = escritura
		.catch(() => undefined)
		.then(async () => {
			await mkdir(dirname(archivoDatos), { recursive: true });
			const temporal = `${archivoDatos}.tmp`;
			await writeFile(temporal, JSON.stringify(store), 'utf8');
			await rename(temporal, archivoDatos);
		});
	return escritura;
}

/** Vuelve al estado inicial (útil en tests). */
export function reiniciarStore(): void {
	store.favores = semillaFavores();
	store.confirmaciones = [];
	store.servicios = semillaServicios();
	store.recomendaciones = [];
	store.alertas = [];
	store.alertasOficiales = [];
	store.emergencias = [];
	cargado = esPrueba;
}
