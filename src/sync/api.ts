import { dao } from '../datos/dao';
import { vaciarColaOutbox } from './motor';

/** API de compatibilidad para código existente. */
export async function publicar(entidad: string, payload: object) {
	const op_id = crypto.randomUUID();
	await dao.transaccion(async () => {
		await dao.aplicarLocal(entidad, {
			...(payload as Record<string, unknown>),
			id: (payload as any).id ?? op_id
		});
		await dao.encolar({ op_id, entidad, operacion: 'crear', payload });
	});
	if (typeof navigator !== 'undefined' && navigator.onLine) void vaciarColaOutbox();
	return op_id;
}

export async function vaciarCola() {
	await vaciarColaOutbox();
}
