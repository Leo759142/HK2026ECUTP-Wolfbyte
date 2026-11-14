import { n as conSesion } from "../../../../../../chunks/api.js";
import { r as json } from "../../../../../../chunks/http.js";
import { c as pendientes } from "../../../../../../chunks/favores2.js";
// src/routes/api/v1/moderacion/pendientes/+server.ts
var GET = conSesion(async ({ db, s }) => json(await pendientes(db, s)));
export { GET };

//# sourceMappingURL=_server.ts.js.map