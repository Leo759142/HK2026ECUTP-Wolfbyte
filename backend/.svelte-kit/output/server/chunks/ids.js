import { createHash, randomBytes } from "node:crypto";
// src/lib/server/ids.ts
/**
* UUID estable a partir de un nombre (estilo UUID v5, SHA-1).
* Se usa para los datos de demostración: el mismo nombre ("u-rosa") da siempre el mismo id.
*/
function uuidDe(nombre) {
	const h = createHash("sha1").update(`ayni:${nombre}`).digest();
	h[6] = h[6] & 15 | 80;
	h[8] = h[8] & 63 | 128;
	const x = h.subarray(0, 16).toString("hex");
	return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20, 32)}`;
}
/** Token opaco para sesiones (256 bits, base64url). */
var nuevoToken = () => randomBytes(32).toString("base64url");
var sha256 = (texto) => createHash("sha256").update(texto).digest("hex");
export { sha256 as n, uuidDe as r, nuevoToken as t };

//# sourceMappingURL=ids.js.map