import { n as conSesion, r as enTx } from "../../../../../../../chunks/api.js";
import { i as leerJson, r as json } from "../../../../../../../chunks/http.js";
import { i as responderInvitacion } from "../../../../../../../chunks/cuentas.js";
// src/routes/api/v1/usuarios/me/invitacion-guardian/+server.ts
var POST = conSesion(async ({ db, s, event }) => {
	const body = await leerJson(event.request);
	return json(await enTx(db, (tx) => responderInvitacion(tx, s, body)));
});
export { POST };

//# sourceMappingURL=_server.ts.js.map