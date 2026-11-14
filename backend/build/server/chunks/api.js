import { a as ruta, n as err, s as obtenerDb } from "./http.js";
// src/lib/server/api.ts
/** Endpoint que necesita sesión iniciada. */
function conSesion(fn) {
	return ruta(async (event) => {
		const s = event.locals.sesion;
		if (!s) throw err.noAutorizado();
		return fn({
			db: await obtenerDb(),
			s,
			event
		});
	});
}
/** Endpoint público (sin sesión). */
function publico(fn) {
	return ruta(async (event) => fn({
		db: await obtenerDb(),
		event
	}));
}
/** Ejecuta una escritura en una transacción (todo o nada). */
var enTx = (db, fn) => db.transaccion(fn);
var param = (event, nombre) => event.params[nombre];
function bool(valor) {
	return valor === "true" || valor === "1";
}
export { publico as a, param as i, conSesion as n, enTx as r, bool as t };

//# sourceMappingURL=api.js.map