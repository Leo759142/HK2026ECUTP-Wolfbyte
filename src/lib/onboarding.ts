import { obtenerAlmacenKV } from '../datos/almacen';
import { translate, type Idioma } from '../i18n';

const KEY = 'onboarding_visto';
const SESSION_KEY = 'ayni:v1:session';
const PASOS_KEY = 'onboarding_paso_actual';

export interface SesionLocal {
	usuarioId: string;
	rol?: string;
	telefono?: string;
	alias?: string;
	expiraEn?: number;
}

export interface OnboardingPaso {
	id: string;
	i18nKey: string;
	i18nKeyAria?: string;
	esCritico: boolean;
	orden: number;
}

/** Pasos del tutorial guiado (RF23). Cada paso tiene clave de traducción
 *  para ES y QU, etiqueta de accesibilidad y marca si es crítico. */
const PASOS: OnboardingPaso[] = [
	{
		id: 'bienvenida',
		i18nKey: 'onboarding.paso1.titulo',
		i18nKeyAria: 'onboarding.paso1.aria',
		esCritico: true,
		orden: 1
	},
	{
		id: 'registrarse',
		i18nKey: 'onboarding.paso2.titulo',
		i18nKeyAria: 'onboarding.paso2.aria',
		esCritico: true,
		orden: 2
	},
	{
		id: 'unirse-grupo',
		i18nKey: 'onboarding.paso3.titulo',
		i18nKeyAria: 'onboarding.paso3.aria',
		esCritico: true,
		orden: 3
	},
	{
		id: 'publicar-servicio',
		i18nKey: 'onboarding.paso4.titulo',
		i18nKeyAria: 'onboarding.paso4.aria',
		esCritico: false,
		orden: 4
	},
	{
		id: 'pedir-favor',
		i18nKey: 'onboarding.paso5.titulo',
		i18nKeyAria: 'onboarding.paso5.aria',
		esCritico: false,
		orden: 5
	}
];

/** Obtiene el paso actual del onboarding (para reanudar o repetir). */
export async function obtenerPasoActual(): Promise<number> {
	const kv = obtenerAlmacenKV();
	const v = await kv.get<number>(PASOS_KEY);
	return v ?? 1;
}

/** Avanza al siguiente paso del onboarding. */
export async function avanzarPaso(actual: number): Promise<void> {
	const kv = obtenerAlmacenKV();
	await kv.set(PASOS_KEY, actual + 1);
}

/** Reinicia el progreso del onboarding al paso 1. */
export async function reiniciarProgreso(): Promise<void> {
	const kv = obtenerAlmacenKV();
	await kv.set(PASOS_KEY, 1);
}

export async function onboardingVisto(): Promise<boolean> {
	const kv = obtenerAlmacenKV();
	const v = await kv.get<boolean>(KEY);
	return v === true;
}

/** Alias de `onboardingVisto` para mayor claridad semántica (RF23). */
export async function estaCompletado(): Promise<boolean> {
	return onboardingVisto();
}

export async function marcarOnboardingVisto(): Promise<void> {
	const kv = obtenerAlmacenKV();
	await kv.set(KEY, true);
}

export async function reiniciarOnboarding(): Promise<void> {
	const kv = obtenerAlmacenKV();
	await kv.del(KEY);
	await reiniciarProgreso();
}

/** Devuelve todos los pasos del tutorial con sus metadatos (RF23). */
export function obtenerPasos(): OnboardingPaso[] {
	return [...PASOS].sort((a, b) => a.orden - b.orden);
}

/** Indica si un paso es crítico (no se puede saltar) (RF23). */
export function esPasoCritico(idPaso: string): boolean {
	return PASOS.some((p) => p.id === idPaso && p.esCritico);
}

/** Traduce un paso al idioma dado. */
export function traducirPaso(paso: OnboardingPaso, idioma: Idioma = 'es'): {
	id: string;
	titulo: string;
	ariaLabel: string;
	esCritico: boolean;
	orden: number;
} {
	return {
		id: paso.id,
		titulo: translate(idioma, paso.i18nKey),
		ariaLabel: translate(idioma, paso.i18nKeyAria ?? paso.i18nKey),
		esCritico: paso.esCritico,
		orden: paso.orden
	};
}

export function obtenerSesionLocal(): SesionLocal | null {
	if (typeof localStorage === 'undefined') return null;
	try {
		const raw = localStorage.getItem(SESSION_KEY);
		if (!raw) return null;
		const sesion = JSON.parse(raw) as SesionLocal;
		if (!sesion.usuarioId || (sesion.expiraEn && Date.now() >= sesion.expiraEn)) {
			localStorage.removeItem(SESSION_KEY);
			return null;
		}
		return sesion;
	} catch {
		localStorage.removeItem(SESSION_KEY);
		return null;
	}
}

export function guardarSesionLocal(sesion: SesionLocal): void {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(SESSION_KEY, JSON.stringify(sesion));
	}
}

export function cerrarSesionLocal(): void {
	if (typeof localStorage !== 'undefined') localStorage.removeItem(SESSION_KEY);
}
