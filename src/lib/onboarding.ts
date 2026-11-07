import { obtenerAlmacenKV } from '../datos/almacen';

const KEY = 'onboarding_visto';

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
