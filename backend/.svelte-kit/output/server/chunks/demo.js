import { t as config } from "./config2.js";
import { n as err } from "./http.js";
import { s as quitarGuardian, t as agregarGuardian } from "./sectores.js";
import { d as obtenerFavor, r as confirmarLado } from "./favores.js";
import { r as reiniciarDemo } from "./seed-demo2.js";
import { i as entero, m as uuid, t as booleano } from "./validar.js";
// src/lib/server/servicios/demo.ts
function exigirDemo() {
	if (!config().demo) throw err.noEncontrado("Las herramientas de demostración están desactivadas en este servidor.", "DEMO_DESACTIVADA");
}
/** "Ver AYNI como Guardián". */
async function comoGuardian(db, s, body) {
	exigirDemo();
	if (booleano(body.activo, "activo")) await agregarGuardian(db, s.sectorId, s.usuarioId);
	else await quitarGuardian(db, s.sectorId, s.usuarioId);
}
/** "Simular 2 meses en AYNI": mueve la fecha de alta y vuelve a ofrecer la invitación. */
async function simularAntiguedad(db, s, body) {
	exigirDemo();
	const dias = body.dias === void 0 ? 61 : entero(body.dias, "dias", 0, 3650);
	await db.query(`UPDATE usuarios SET creado_en = now() - ($2::int * interval '1 day'), invitacion_guardian = NULL WHERE id = $1`, [s.usuarioId, dias]);
}
/** "Simular que el otro también confirmó" un favor reservado. */
async function confirmarOtroLado(db, s, favorId) {
	exigirDemo();
	const f = await obtenerFavor(db, uuid(favorId, "El favor"));
	if (!f || f.sector_id !== s.sectorId) throw err.noEncontrado();
	if (f.estado !== "reservado") throw err.conflicto("El favor no está reservado.", "NO_RESERVADO");
	if (f.dueno_id === s.usuarioId) await confirmarLado(db, f.id, "tomador");
	else if (f.tomador_id === s.usuarioId) await confirmarLado(db, f.id, "dueno");
	else throw err.prohibido();
}
/** "Reiniciar datos de demostración": borra TODO y vuelve a cargar el sector de ejemplo. */
async function reiniciar(db) {
	exigirDemo();
	await reiniciarDemo(db);
}
export { simularAntiguedad as a, reiniciar as i, confirmarOtroLado as n, exigirDemo as r, comoGuardian as t };

//# sourceMappingURL=demo.js.map