import { obtenerAlmacenKV } from '../datos/almacen';

const KEY = 'onboarding_visto';
const SESSION_KEY = 'ayni:v1:session';

export interface SesionLocal {
	usuarioId: string;
	rol?: string;
	telefono?: string;
	alias?: string;
	expiraEn?: number;
}

export async function onboardingVisto(): Promise<boolean> {
	const kv = obtenerAlmacenKV();
	const v = await kv.get<boolean>(KEY);
	return v === true;
}

export async function marcarOnboardingVisto(): Promise<void> {
	const kv = obtenerAlmacenKV();
	await kv.set(KEY, true);
}

export async function reiniciarOnboarding(): Promise<void> {
	const kv = obtenerAlmacenKV();
	await kv.del(KEY);
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
