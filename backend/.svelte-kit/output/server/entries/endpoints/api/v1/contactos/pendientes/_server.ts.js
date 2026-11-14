import { n as conSesion } from "../../../../../../chunks/api.js";
import { r as json } from "../../../../../../chunks/http.js";
import { l as misContactos } from "../../../../../../chunks/servicios.js";
// src/routes/api/v1/contactos/pendientes/+server.ts
/** "¿Te atendió…?": contactos que aún no respondí. */
var GET = conSesion(async ({ db, s }) => json(await misContactos(db, s.usuarioId, { pendientes: true })));
export { GET };

//# sourceMappingURL=_server.ts.js.map