/** Estado público del servidor: modo demo, base de datos y reglas configurables (lo consulta el frontend al abrir). */
import { publico } from '#server/api.ts';
import { config } from '#server/config.ts';
import { json } from '#server/http.ts';

export const GET = publico(async ({ db }) => {
	const cfg = config();
	await db.query('SELECT 1');
	return json({
		ok: true,
		version: '1.0.0',
		demo: cfg.demo,
		base_de_datos: 'postgresql',
		confirmaciones_requeridas: cfg.confirmacionesRequeridas,
		hora_servidor: new Date().toISOString()
	});
});
