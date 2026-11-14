import { n as conSesion } from "../../../../../../chunks/api.js";
import { i as leerJson, o as sinContenido } from "../../../../../../chunks/http.js";
import { f as texto, u as opcion } from "../../../../../../chunks/validar.js";
// src/routes/api/v1/notificaciones/suscripcion/+server.ts
/** Guarda el dispositivo para avisos de emergencia. (El envío de push requiere claves VAPID: ver docs/INTEGRACION.md.) */
var POST = conSesion(async ({ db, s, event }) => {
	const b = await leerJson(event.request);
	const canal = opcion(b.canal, "canal", ["webpush", "whatsapp"]);
	const endpoint = texto(b.endpoint, "endpoint", {
		min: 3,
		max: 1e3
	});
	const claves = b.claves && typeof b.claves === "object" ? JSON.stringify(b.claves) : null;
	await db.query(`INSERT INTO suscripciones_push (usuario_id, canal, endpoint, claves) VALUES ($1, $2, $3, $4)
		 ON CONFLICT (usuario_id, endpoint) DO UPDATE SET canal = EXCLUDED.canal, claves = EXCLUDED.claves`, [
		s.usuarioId,
		canal,
		endpoint,
		claves
	]);
	return sinContenido();
});
export { POST };

//# sourceMappingURL=_server.ts.js.map