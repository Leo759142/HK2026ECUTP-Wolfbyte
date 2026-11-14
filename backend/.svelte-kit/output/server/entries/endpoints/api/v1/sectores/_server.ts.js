import { a as publico } from "../../../../../chunks/api.js";
import { r as json } from "../../../../../chunks/http.js";
import { a as listarSectores } from "../../../../../chunks/sectores.js";
// src/routes/api/v1/sectores/+server.ts
/** Sectores para elegir al registrarse (sin datos de vecinos). */
var GET = publico(async ({ db }) => json(await listarSectores(db)));
export { GET };

//# sourceMappingURL=_server.ts.js.map