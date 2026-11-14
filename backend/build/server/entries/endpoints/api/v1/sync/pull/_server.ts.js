import { n as conSesion } from "../../../../../../chunks/api.js";
import { r as json } from "../../../../../../chunks/http.js";
import { t as pull } from "../../../../../../chunks/sync.js";
// src/routes/api/v1/sync/pull/+server.ts
var GET = conSesion(async ({ db, s, event }) => json(await pull(db, s, event.url.searchParams.get("desde"))));
export { GET };

//# sourceMappingURL=_server.ts.js.map