import { n as err } from "./http.js";
import { a as crearReporte, c as liberarReservasVencidas, d as obtenerFavor, f as pendientesModeracion, i as crearFavor, m as resolverModeracion, n as actualizarFavor, o as eliminarFavor, p as reservarFavor, r as confirmarLado, s as liberarFavor, t as MOTIVOS, u as misReportes } from "./favores.js";
import { s as filaServicio } from "./servicios.js";
import { o as telefonoDe } from "./usuarios.js";
import { c as whatsappUrl } from "./dto.js";
import { f as texto, m as uuid, o as fechaIso, r as detalles, s as foto, u as opcion } from "./validar.js";
// src/lib/server/servicios/favores.ts
var TIPOS = [
	"pido",
	"presto",
	"regalo",
	"intercambio"
];
async function delSector(db, s, id) {
	const f = await obtenerFavor(db, uuid(id, "El favor"));
	if (!f || f.sector_id !== s.sectorId || f.eliminado_en) throw err.noEncontrado("Esta publicación ya no está disponible.");
	return f;
}
/** Enlace de WhatsApp entre las dos partes de una reserva (solo ellos lo reciben). */
async function conEnlace(db, s, f) {
	const soyDueno = f.dueno_id === s.usuarioId;
	const soyTomador = f.tomador_id === s.usuarioId;
	if (f.estado !== "reservado" || !soyDueno && !soyTomador) return f;
	const otroId = soyDueno ? f.tomador_id : f.dueno_id;
	const otro = soyDueno ? f.tomador : f.dueno;
	const tel = await telefonoDe(db, otroId);
	return {
		...f,
		whatsapp_url: tel ? whatsappUrl(tel, `Hola ${otro?.nombre ?? ""}, te escribo desde AYNI por: ${f.titulo}.`) : null
	};
}
async function detalle(db, s, id) {
	await liberarReservasVencidas(db);
	const f = await delSector(db, s, id);
	if (f.moderacion !== "visible" && f.dueno_id !== s.usuarioId) throw err.noEncontrado("Esta publicación ya no está disponible.");
	return conEnlace(db, s, f);
}
function datos(body) {
	return {
		tipo: opcion(body.tipo, "tipo", TIPOS),
		titulo: texto(body.titulo, "El título", {
			min: 3,
			max: 200
		}),
		detalles: detalles(body.detalles),
		foto: foto(body.foto)
	};
}
async function crear(db, s, body) {
	const id = uuid(body.id, "El id");
	const d = datos(body);
	const creado = await crearFavor(db, {
		id,
		duenoId: s.usuarioId,
		...d
	});
	const f = await obtenerFavor(db, id);
	if (!f || f.dueno_id !== s.usuarioId) throw err.conflicto("Ese id ya está en uso.", "ID_EN_USO");
	return {
		favor: f,
		creado
	};
}
/** Editar mi favor mientras está disponible (la última escritura gana). */
async function editar(db, s, id, body) {
	const f = await delSector(db, s, id);
	if (f.dueno_id !== s.usuarioId) throw err.prohibido("Solo quien publicó puede editarlo.");
	if (f.estado !== "disponible") throw err.conflicto("Solo puedes editar un favor que está disponible.", "NO_EDITABLE");
	const cuando = fechaIso(body.actualizado_en, "actualizado_en");
	if (cuando && cuando.getTime() < new Date(f.actualizado_en).getTime()) throw err.conflicto("Ya había un cambio más reciente de esta publicación.", "DESACTUALIZADO");
	const c = {};
	if ("titulo" in body) c.titulo = texto(body.titulo, "El título", {
		min: 3,
		max: 200
	});
	if ("detalles" in body) c.detalles = detalles(body.detalles);
	if ("foto" in body) c.foto = foto(body.foto);
	await actualizarFavor(db, f.id, c);
	return await obtenerFavor(db, f.id);
}
async function eliminar(db, s, id) {
	const f = await obtenerFavor(db, uuid(id, "El favor"));
	if (!f || f.eliminado_en) return;
	if (f.dueno_id !== s.usuarioId) throw err.prohibido("Solo quien publicó puede eliminarlo.");
	if (f.estado === "reservado") throw err.conflicto("Tiene una reserva activa: libérala antes de eliminarlo.", "RESERVADO");
	if (f.estado === "cerrado") throw err.conflicto("Un favor cerrado forma parte del Balance de Ayni y no se elimina.", "CERRADO");
	await eliminarFavor(db, f.id);
}
async function reservar(db, s, id) {
	await liberarReservasVencidas(db);
	const f = await delSector(db, s, id);
	if (f.dueno_id === s.usuarioId) throw err.invalido("Es tu propia publicación.", "ES_TUYO");
	if (f.estado === "reservado" && f.tomador_id === s.usuarioId) return conEnlace(db, s, f);
	if (!await reservarFavor(db, f.id, s.usuarioId)) throw err.conflicto("Otro vecino lo reservó primero. Si no se concreta en 1 hora, vuelve a estar disponible.", "RESERVA_OCUPADA");
	return conEnlace(db, s, await obtenerFavor(db, f.id));
}
async function liberar(db, s, id) {
	await liberarReservasVencidas(db);
	const f = await delSector(db, s, id);
	if (f.dueno_id !== s.usuarioId && f.tomador_id !== s.usuarioId) throw err.prohibido("Solo el dueño o quien reservó puede soltar la reserva.");
	if (f.estado === "disponible") return f;
	if (f.estado !== "reservado" || !await liberarFavor(db, f.id)) throw err.conflicto("Este favor ya no está reservado.", "NO_RESERVADO");
	return await obtenerFavor(db, f.id);
}
async function listo(db, s, id) {
	await liberarReservasVencidas(db);
	const f = await delSector(db, s, id);
	const lado = f.dueno_id === s.usuarioId ? "dueno" : f.tomador_id === s.usuarioId ? "tomador" : null;
	if (!lado) throw err.prohibido("Solo las dos personas del favor pueden confirmarlo.");
	if (f.estado === "cerrado") return f;
	if (f.estado !== "reservado") throw err.conflicto("La reserva venció o se liberó. Vuelve a reservarlo.", "NO_RESERVADO");
	await confirmarLado(db, f.id, lado);
	return conEnlace(db, s, await obtenerFavor(db, f.id));
}
async function reportar(db, s, body) {
	const id = uuid(body.id, "El id");
	const tipo = opcion(body.objeto_tipo, "objeto_tipo", ["servicio", "favor"]);
	const objetoId = uuid(body.objeto_id, "La publicación");
	const motivo = opcion(body.motivo, "motivo", MOTIVOS);
	let dueno = null;
	let sector = null;
	if (tipo === "servicio") {
		const fila = await filaServicio(db, objetoId);
		dueno = fila?.dueno_id ?? null;
		sector = fila && !fila.eliminado_en ? fila.sector_id : null;
	} else {
		const f = await obtenerFavor(db, objetoId);
		dueno = f?.dueno_id ?? null;
		sector = f && !f.eliminado_en ? f.sector_id : null;
	}
	if (!sector || sector !== s.sectorId) throw err.noEncontrado("Esa publicación ya no está disponible.");
	if (dueno === s.usuarioId) throw err.invalido("No puedes reportar tu propia publicación.", "ES_TUYO");
	const ya = (await misReportes(db, s.usuarioId)).find((r) => r.objeto_id === objetoId);
	if (ya) {
		if (ya.id === id) return { creado: false };
		throw err.conflicto("Ya enviaste un reporte de esta publicación. Un Guardián lo está revisando.", "YA_REPORTADO");
	}
	return { creado: await crearReporte(db, {
		id,
		tipo,
		objetoId,
		usuarioId: s.usuarioId,
		motivo
	}) };
}
function soloGuardian(s) {
	if (!s.esGuardian) throw err.prohibido("Solo los Guardianes del sector pueden hacer esto.", "SOLO_GUARDIAN");
}
async function pendientes(db, s) {
	soloGuardian(s);
	return pendientesModeracion(db, s.sectorId);
}
async function resolver(db, s, body) {
	soloGuardian(s);
	const tipo = opcion(body.objeto_tipo, "objeto_tipo", ["servicio", "favor"]);
	const objetoId = uuid(body.objeto_id, "La publicación");
	const decision = opcion(body.decision, "decision", ["aprobar", "ocultar"]);
	const sector = tipo === "servicio" ? (await filaServicio(db, objetoId))?.sector_id : (await obtenerFavor(db, objetoId))?.sector_id;
	if (!sector) throw err.noEncontrado();
	if (sector !== s.sectorId) throw err.prohibido("Esa publicación es de otro sector.", "SOLO_GUARDIAN");
	await resolverModeracion(db, tipo, objetoId, s.usuarioId, decision);
}
export { eliminar as a, pendientes as c, resolver as d, editar as i, reportar as l, crear as n, liberar as o, detalle as r, listo as s, TIPOS as t, reservar as u };

//# sourceMappingURL=favores2.js.map