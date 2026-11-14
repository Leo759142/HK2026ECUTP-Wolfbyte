import { n as err, t as aErrorApi } from "./http.js";
import { i as iso } from "./dto.js";
import { i as leerSesion } from "./sesion.js";
import { a as esUuid, o as fechaIso, u as opcion } from "./validar.js";
import { i as responderInvitacion, t as actualizarPerfil } from "./cuentas.js";
import { a as editar, c as responderContacto, n as contactar, o as eliminar, r as crear, s as recomendar } from "./servicios2.js";
import { a as eliminar$1, d as resolver, i as editar$1, l as reportar, n as crear$1, o as liberar, s as listo, u as reservar } from "./favores2.js";
import { a as descartar, c as pedirAyuda, d as resolverPedido, f as listarEmergencias, i as confirmar, m as listarPedidos, n as atender, o as lector, p as listarGrupos, r as ayudar, t as acusar, u as reportar$1 } from "./emergencias.js";
import { c as listarServicios, l as misContactos, m as recomendacionesDelSector } from "./servicios.js";
import { c as liberarReservasVencidas, f as pendientesModeracion, l as listarFavores, u as misReportes } from "./favores.js";
import { i as obtenerUsuario, s as vecinosDelSector } from "./usuarios.js";
import { l as sectoresCambiados } from "./sectores.js";
// src/lib/server/servicios/sync.ts
var ENTIDADES = [
	"servicios",
	"favores",
	"contactos",
	"recomendaciones",
	"reportes",
	"emergencias",
	"pedidos_ayuda",
	"emergencia_acuses",
	"usuarios",
	"moderacion"
];
var OPERACIONES = [
	"crear",
	"actualizar",
	"eliminar"
];
var accion = (p, opciones) => opcion(p.accion, "accion", opciones);
/** Mismas reglas que los endpoints REST: cada entidad/operación llama al mismo caso de uso. */
var MANEJADORES = {
	servicios: {
		crear: (tx, s, p) => crear(tx, s, p),
		actualizar: (tx, s, p) => editar(tx, s, String(p.id), p),
		eliminar: (tx, s, p) => eliminar(tx, s, String(p.id))
	},
	favores: {
		crear: (tx, s, p) => crear$1(tx, s, p),
		actualizar: (tx, s, p) => {
			if (p.accion === void 0) return editar$1(tx, s, String(p.id), p);
			const a = accion(p, [
				"reservar",
				"liberar",
				"listo"
			]);
			return a === "reservar" ? reservar(tx, s, String(p.id)) : a === "liberar" ? liberar(tx, s, String(p.id)) : listo(tx, s, String(p.id));
		},
		eliminar: (tx, s, p) => eliminar$1(tx, s, String(p.id))
	},
	contactos: {
		crear: (tx, s, p) => contactar(tx, s, String(p.servicio_id), p.id),
		actualizar: (tx, s, p) => responderContacto(tx, s, String(p.id), p)
	},
	recomendaciones: { crear: (tx, s, p) => recomendar(tx, s, String(p.servicio_id), p) },
	reportes: { crear: (tx, s, p) => reportar(tx, s, p) },
	emergencias: {
		crear: (tx, s, p) => reportar$1(tx, s, p),
		actualizar: (tx, s, p) => {
			const a = accion(p, [
				"confirmar",
				"descartar",
				"atender"
			]);
			return a === "confirmar" ? confirmar(tx, s, String(p.id)) : a === "descartar" ? descartar(tx, s, String(p.id), p) : atender(tx, s, String(p.id));
		}
	},
	pedidos_ayuda: {
		crear: (tx, s, p) => pedirAyuda(tx, s, String(p.emergencia_id), p),
		actualizar: (tx, s, p) => accion(p, ["ayudar", "resolver"]) === "ayudar" ? ayudar(tx, s, String(p.id)) : resolverPedido(tx, s, String(p.id))
	},
	emergencia_acuses: {
		crear: (tx, s, p) => acusar(tx, s, String(p.emergencia_id), p),
		actualizar: (tx, s, p) => acusar(tx, s, String(p.emergencia_id), p)
	},
	usuarios: { actualizar: (tx, s, p) => p.accion === "invitacion" ? responderInvitacion(tx, s, p) : actualizarPerfil(tx, s, p) },
	moderacion: { crear: (tx, s, p) => resolver(tx, s, p) }
};
async function push(db, sesion, token, body) {
	if (!Array.isArray(body.operaciones)) throw err.invalido("Envía { operaciones: [...] }.");
	if (body.operaciones.length > 100) throw err.invalido("Máximo 100 operaciones por envío.");
	let s = sesion;
	const resultados = [];
	for (const bruta of body.operaciones) {
		const op = bruta && typeof bruta === "object" ? bruta : {};
		const opId = esUuid(op.op_id) ? String(op.op_id).toLowerCase() : null;
		if (!opId) {
			resultados.push({
				op_id: String(op.op_id ?? ""),
				resultado: "rechazada",
				codigo: "OP_ID_INVALIDO",
				motivo: "op_id debe ser un UUID."
			});
			continue;
		}
		const [previa] = await db.query("SELECT usuario_id, resultado, codigo, motivo FROM sync_operaciones WHERE op_id = $1", [opId]);
		if (previa) {
			if (previa.usuario_id !== s.usuarioId) resultados.push({
				op_id: opId,
				resultado: "rechazada",
				codigo: "OP_ID_EN_USO",
				motivo: "Ese op_id pertenece a otra cuenta."
			});
			else if (previa.resultado === "aplicada") resultados.push({
				op_id: opId,
				resultado: "duplicada"
			});
			else resultados.push({
				op_id: opId,
				resultado: "rechazada",
				codigo: previa.codigo,
				motivo: previa.motivo
			});
			continue;
		}
		const entidad = ENTIDADES.includes(String(op.entidad)) ? op.entidad : null;
		const operacion = OPERACIONES.includes(String(op.operacion)) ? op.operacion : null;
		const creadoLocal = (() => {
			const d = new Date(String(op.creado_en ?? ""));
			return Number.isNaN(d.getTime()) ? /* @__PURE__ */ new Date() : d;
		})();
		const payload = op.payload && typeof op.payload === "object" && !Array.isArray(op.payload) ? op.payload : null;
		const manejador = entidad && operacion ? MANEJADORES[entidad][operacion] : void 0;
		try {
			if (!entidad || !operacion || !manejador) throw err.invalido(`Operación no soportada: ${String(op.entidad)}/${String(op.operacion)}.`, "OPERACION_NO_SOPORTADA");
			if (!payload) throw err.invalido("La operación no trae datos (payload).");
			await db.transaccion(async (tx) => {
				await manejador(tx, s, payload);
				await tx.query(`INSERT INTO sync_operaciones (op_id, usuario_id, entidad, operacion, resultado, creado_local) VALUES ($1, $2, $3, $4, 'aplicada', $5)`, [
					opId,
					s.usuarioId,
					entidad,
					operacion,
					creadoLocal
				]);
			});
			resultados.push({
				op_id: opId,
				resultado: "aplicada"
			});
			if (entidad === "usuarios") s = (await leerSesion(db, token)).sesion ?? s;
		} catch (e) {
			const ea = aErrorApi(e);
			if (ea.status >= 500) {
				resultados.push({
					op_id: opId,
					resultado: "rechazada",
					codigo: "REINTENTAR",
					motivo: ea.message
				});
				continue;
			}
			if (entidad && operacion) await db.query(`INSERT INTO sync_operaciones (op_id, usuario_id, entidad, operacion, resultado, codigo, motivo, creado_local)
						 VALUES ($1, $2, $3, $4, 'rechazada', $5, $6, $7) ON CONFLICT (op_id) DO NOTHING`, [
				opId,
				s.usuarioId,
				entidad,
				operacion,
				ea.codigo,
				ea.message,
				creadoLocal
			]).catch(() => void 0);
			resultados.push({
				op_id: opId,
				resultado: "rechazada",
				codigo: ea.codigo,
				motivo: ea.message
			});
		}
	}
	return { resultados };
}
/** Publicaciones que un vecino no debe ver (ocultas por moderación o eliminadas): solo se envía su id para quitarlas. */
function separarOcultos(lista, s) {
	const visibles = [];
	const eliminados = [];
	for (const x of lista) {
		const mio = x.dueno_id === s.usuarioId;
		const borrado = Boolean(x.eliminado_en);
		const oculto = x.moderacion === "oculto" || x.moderacion === "en_revision" && !s.esGuardian;
		if (borrado || oculto && !mio) eliminados.push(x.id);
		else visibles.push(x);
	}
	return {
		visibles,
		eliminados
	};
}
async function pull(db, s, desdeTexto) {
	const desde = desdeTexto ? fechaIso(desdeTexto, "desde") : null;
	const [{ ahora }] = await db.query("SELECT now() AS ahora");
	const d = desde ? /* @__PURE__ */ new Date(desde.getTime() - 2e3) : null;
	await liberarReservasVencidas(db);
	const servicios = separarOcultos(await listarServicios(db, {
		sectorId: s.sectorId,
		yo: s.usuarioId,
		miManzana: s.manzana,
		todos: true,
		desde: d
	}), s);
	const favores = separarOcultos(await listarFavores(db, {
		sectorId: s.sectorId,
		yo: s.usuarioId,
		todos: true,
		desde: d
	}), s);
	const lector$1 = lector(s);
	return {
		hasta: iso(ahora),
		completo: !desde,
		cambios: {
			yo: await obtenerUsuario(db, s.usuarioId),
			sectores: await sectoresCambiados(db, s.sectorId, d),
			usuarios: await vecinosDelSector(db, s.sectorId, d),
			servicios: servicios.visibles,
			recomendaciones: await recomendacionesDelSector(db, s.sectorId, d),
			contactos: await misContactos(db, s.usuarioId, { desde: d }),
			favores: favores.visibles,
			reportes: await misReportes(db, s.usuarioId),
			moderacion: s.esGuardian ? await pendientesModeracion(db, s.sectorId) : [],
			emergencias: await listarEmergencias(db, lector$1, { desde: d }),
			pedidos_ayuda: await listarPedidos(db, s, { desde: d }),
			grupos_apoyo: await listarGrupos(db, s.sectorId, { desde: d })
		},
		eliminados: {
			servicios: servicios.eliminados,
			favores: favores.eliminados
		}
	};
}
export { push as n, pull as t };

//# sourceMappingURL=sync.js.map