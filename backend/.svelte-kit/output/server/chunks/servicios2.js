import { n as err } from "./http.js";
import { a as crearServicio, d as obtenerRecomendacion, f as obtenerServicio, h as responderContacto$1, i as crearRecomendacion, n as contactoAbierto, o as eliminarServicio, p as recomendacionesDeServicio, r as crearContacto, s as filaServicio, t as actualizarServicio, u as obtenerContacto } from "./servicios.js";
import { o as telefonoDe } from "./usuarios.js";
import { c as whatsappUrl } from "./dto.js";
import { c as listaUnica, f as texto, m as uuid, o as fechaIso, p as textoONull, s as foto, t as booleano, u as opcion } from "./validar.js";
// src/lib/server/servicios/servicios.ts
var CATEGORIAS = [
	"gasfiteria",
	"electricidad",
	"carpinteria",
	"cerrajeria",
	"mascotas",
	"clases",
	"costura",
	"comida",
	"otros"
];
var ETIQUETAS = [
	"puntual",
	"precio",
	"limpio",
	"amable",
	"rapido",
	"volveria"
];
var CLASES = ["servicio", "producto"];
function datos(body) {
	return {
		clase: opcion(body.clase ?? "servicio", "clase", CLASES),
		categoria: opcion(body.categoria, "categoria", CATEGORIAS),
		titulo: texto(body.titulo, "El nombre corto", {
			min: 3,
			max: 40
		}),
		descripcion: texto(body.descripcion, "La descripción", {
			min: 10,
			max: 200
		}),
		horario: texto(body.horario, "El horario", {
			min: 1,
			max: 80
		}),
		precio: textoONull(body.precio, "El precio", { max: 40 }),
		foto: foto(body.foto),
		mostrar_nombre_completo: body.mostrar_nombre_completo === void 0 ? false : booleano(body.mostrar_nombre_completo, "mostrar_nombre_completo")
	};
}
/** Servicio visible para mí (de mi sector y no eliminado; los ocultos solo para su dueño). */
async function visible(db, s, id) {
	const sv = await obtenerServicio(db, uuid(id, "El servicio"), s.manzana);
	const fila = sv && await filaServicio(db, sv.id);
	const mio = sv?.dueno_id === s.usuarioId;
	if (!sv || !fila || fila.sector_id !== s.sectorId || sv.eliminado_en || !mio && (sv.moderacion !== "visible" || sv.estado !== "disponible")) throw err.noEncontrado("Esta publicación ya no está disponible.");
	return sv;
}
var detalle = visible;
async function crear(db, s, body) {
	const id = uuid(body.id, "El id");
	const d = datos(body);
	const creado = await crearServicio(db, id, s.usuarioId, d);
	const fila = await filaServicio(db, id);
	if (!creado && fila?.dueno_id !== s.usuarioId) throw err.conflicto("Ese id ya está en uso.", "ID_EN_USO");
	return {
		servicio: await obtenerServicio(db, id, s.manzana),
		creado
	};
}
/** Editar, pausar o reactivar mi servicio. Conflictos: la última escritura gana (por actualizado_en del dispositivo). */
async function editar(db, s, id, body) {
	const fila = await filaServicio(db, uuid(id, "El servicio"));
	if (!fila || fila.eliminado_en) throw err.noEncontrado();
	if (fila.dueno_id !== s.usuarioId) throw err.prohibido("Solo quien publicó puede editar esta publicación.");
	const cuando = fechaIso(body.actualizado_en, "actualizado_en");
	if (cuando && cuando.getTime() < new Date(fila.actualizado_en).getTime()) throw err.conflicto("Ya había un cambio más reciente de esta publicación.", "DESACTUALIZADO");
	const c = {};
	if ("clase" in body) c.clase = opcion(body.clase, "clase", CLASES);
	if ("categoria" in body) c.categoria = opcion(body.categoria, "categoria", CATEGORIAS);
	if ("titulo" in body) c.titulo = texto(body.titulo, "El nombre corto", {
		min: 3,
		max: 40
	});
	if ("descripcion" in body) c.descripcion = texto(body.descripcion, "La descripción", {
		min: 10,
		max: 200
	});
	if ("horario" in body) c.horario = texto(body.horario, "El horario", {
		min: 1,
		max: 80
	});
	if ("precio" in body) c.precio = textoONull(body.precio, "El precio", { max: 40 });
	if ("foto" in body) c.foto = foto(body.foto);
	if ("mostrar_nombre_completo" in body) c.mostrar_nombre_completo = booleano(body.mostrar_nombre_completo, "mostrar_nombre_completo");
	if ("estado" in body) c.estado = opcion(body.estado, "estado", ["disponible", "pausado"]);
	await actualizarServicio(db, fila.id, c);
	return await obtenerServicio(db, fila.id, s.manzana);
}
async function eliminar(db, s, id) {
	const fila = await filaServicio(db, uuid(id, "El servicio"));
	if (!fila || fila.eliminado_en) return;
	if (fila.dueno_id !== s.usuarioId) throw err.prohibido("Solo quien publicó puede eliminar esta publicación.");
	await eliminarServicio(db, fila.id);
}
/** "Escribir por WhatsApp": anota el contacto y devuelve el enlace (el número nunca se lista). */
async function contactar(db, s, servicioId, contactoId) {
	const sv = await visible(db, s, servicioId);
	if (sv.dueno_id === s.usuarioId) throw err.invalido("Es tu propia publicación.", "ES_TUYO");
	let c = await contactoAbierto(db, sv.id, s.usuarioId);
	if (!c) c = await crearContacto(db, contactoId ? uuid(contactoId, "El id") : crypto.randomUUID(), sv.id, s.usuarioId);
	const tel = await telefonoDe(db, sv.dueno_id);
	const nombre = sv.dueno?.nombre ?? "";
	return {
		...c,
		whatsapp_url: tel ? whatsappUrl(tel, `Hola ${nombre}, te vi en AYNI. Me interesa: ${sv.titulo}.`) : null
	};
}
async function responderContacto(db, s, id, body) {
	const c = await obtenerContacto(db, uuid(id, "El contacto"));
	if (!c) throw err.noEncontrado();
	if (c.usuario_id !== s.usuarioId) throw err.prohibido();
	const atendido = booleano(body.atendido, "atendido");
	if (c.respondido) return c.atendido === atendido ? c : responderContacto$1(db, c.id, atendido);
	return responderContacto$1(db, c.id, atendido);
}
/** Visto Bueno: 1 a 6 etiquetas, solo si te atendieron, una vez por servicio y nunca el propio (lo valida también el trigger). */
async function recomendar(db, s, servicioId, body) {
	const id = uuid(body.id, "El id");
	const previa = await obtenerRecomendacion(db, id);
	if (previa) {
		if (previa.usuario_id !== s.usuarioId) throw err.conflicto("Ese id ya está en uso.", "ID_EN_USO");
		return {
			reco: previa,
			creada: false
		};
	}
	const sv = await visible(db, s, servicioId);
	if (sv.dueno_id === s.usuarioId) throw err.prohibido("No puedes recomendar tu propio servicio.", "NO_PUEDE_RECOMENDAR");
	const etiquetas = listaUnica(body.etiquetas, "Las etiquetas", ETIQUETAS, 1, 6);
	const comentario = texto(body.comentario, "El comentario", {
		max: 200,
		opcional: true
	});
	if ((await recomendacionesDeServicio(db, sv.id)).some((r) => r.usuario_id === s.usuarioId)) throw err.conflicto("Ya le diste tu Visto Bueno 💜", "YA_RECOMENDADO");
	await crearRecomendacion(db, {
		id,
		servicioId: sv.id,
		usuarioId: s.usuarioId,
		etiquetas,
		comentario
	});
	return {
		reco: await obtenerRecomendacion(db, id),
		creada: true
	};
}
export { editar as a, responderContacto as c, detalle as i, contactar as n, eliminar as o, crear as r, recomendar as s, CATEGORIAS as t };

//# sourceMappingURL=servicios2.js.map