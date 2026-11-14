import { n as conSesion, r as enTx } from "../../../../../../chunks/api.js";
import { i as leerJson, r as json } from "../../../../../../chunks/http.js";
import { d as resolver } from "../../../../../../chunks/favores2.js";
// src/routes/api/v1/moderacion/resolver/+server.ts
var POST = conSesion(async ({ db, s, event }) => {
	const body = await leerJson(event.request);
	await enTx(db, (tx) => resolver(tx, s, body));
	return json({ ok: true });
});
export { POST };

//# sourceMappingURL=_server.ts.js.map