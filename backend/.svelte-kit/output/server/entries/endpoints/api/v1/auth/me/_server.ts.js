import { n as conSesion } from "../../../../../../chunks/api.js";
import { r as json } from "../../../../../../chunks/http.js";
import { i as obtenerUsuario } from "../../../../../../chunks/usuarios.js";
// src/routes/api/v1/auth/me/+server.ts
var GET = conSesion(async ({ db, s }) => json(await obtenerUsuario(db, s.usuarioId)));
export { GET };

//# sourceMappingURL=_server.ts.js.map