import { conSesion } from '#server/api.ts';
import { leerJson, sinContenido } from '#server/http.ts';
import { opcion, texto } from '#server/validar.ts';

/** Guarda el dispositivo para avisos de emergencia. (El envío de push requiere claves VAPID: ver docs/INTEGRACION.md.) */
export const POST = conSesion(async ({ db, s, event }) => {
	const b = await leerJson(event.request);
	const canal = opcion(b.canal, 'canal', ['webpush', 'whatsapp'] as const);
	const endpoint = texto(b.endpoint, 'endpoint', { min: 3, max: 1000 });
	const claves = b.claves && typeof b.claves === 'object' ? JSON.stringify(b.claves) : null;
	await db.query(
		`INSERT INTO suscripciones_push (usuario_id, canal, endpoint, claves) VALUES ($1, $2, $3, $4)
		 ON CONFLICT (usuario_id, endpoint) DO UPDATE SET canal = EXCLUDED.canal, claves = EXCLUDED.claves`,
		[s.usuarioId, canal, endpoint, claves]
	);
	return sinContenido();
});
