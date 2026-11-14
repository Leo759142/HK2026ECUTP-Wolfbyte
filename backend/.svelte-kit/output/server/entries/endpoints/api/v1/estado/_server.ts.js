import { a as publico } from "../../../../../chunks/api.js";
import { t as config } from "../../../../../chunks/config2.js";
import { r as json } from "../../../../../chunks/http.js";
// src/routes/api/v1/estado/+server.ts
/** Estado público del servidor: modo demo, base de datos y reglas configurables (lo consulta el frontend al abrir). */
var GET = publico(async ({ db }) => {
	const cfg = config();
	await db.query("SELECT 1");
	return json({
		ok: true,
		version: "1.0.0",
		demo: cfg.demo,
		base_de_datos: "postgresql",
		confirmaciones_requeridas: cfg.confirmacionesRequeridas,
		hora_servidor: (/* @__PURE__ */ new Date()).toISOString()
	});
});
export { GET };

//# sourceMappingURL=_server.ts.js.map