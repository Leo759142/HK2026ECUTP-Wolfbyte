import { n as err } from "./http.js";
import { t as config } from "./config2.js";
import { i as iso, n as colsVecino, s as vecino } from "./dto.js";
import { c as listaUnica, f as texto, i as entero, m as uuid, s as foto, t as booleano, u as opcion } from "./validar.js";
// src/lib/server/repositorios/emergencias.ts
var SELECT_EMERGENCIA = `
	SELECT e.*, ${colsVecino("u", "r")},
	       (SELECT count(*)::int FROM emergencia_confirmaciones c WHERE c.emergencia_id = e.id) AS n_confirmaciones,
	       a.respuesta AS mi_respuesta, coalesce(a.fin_visto, false) AS mi_fin_visto,
	       greatest(e.actualizado_en, (SELECT max(x.actualizado_en) FROM emergencia_acuses x WHERE x.emergencia_id = e.id),
	                (SELECT max(p.actualizado_en) FROM pedidos_ayuda p WHERE p.emergencia_id = e.id)) AS cambio
	  FROM emergencias e
	  JOIN usuarios u ON u.id = e.reportero_id
	  LEFT JOIN emergencia_acuses a ON a.emergencia_id = e.id AND a.usuario_id = $1`;
async function resumen(db, id) {
	const [r] = await db.query("SELECT * FROM v_emergencia_resumen WHERE emergencia_id = $1", [id]);
	const out = {};
	for (const k of [
		"pedidos_total",
		"pedidos_resueltos",
		"pedidos_sin_atender",
		"vecinos_ayudando",
		"a_salvo",
		"necesitan_ayuda",
		"vecinos_avisados"
	]) out[k] = Number(r?.[k] ?? 0);
	return out;
}
function aDto(f, requeridas) {
	return {
		id: String(f.id),
		tipo: String(f.tipo),
		texto: String(f.texto ?? ""),
		foto: f.foto ?? null,
		sector_id: String(f.sector_id),
		reportero_id: String(f.reportero_id),
		reportero: vecino(f, "r"),
		manzana: String(f.manzana).trim(),
		estado: f.estado,
		confirmada_por: f.confirmada_por ?? null,
		confirmada_en: iso(f.confirmada_en),
		motivo_descarte: f.motivo_descarte ?? null,
		revisada_por: f.revisada_por ?? null,
		revisada_en: iso(f.revisada_en),
		atendida_en: iso(f.atendida_en),
		cerrada_por: f.cerrada_por ?? null,
		reportero_visto: Boolean(f.reportero_visto),
		vence_en: iso(f.vence_en),
		confirmaciones: {
			actuales: Number(f.n_confirmaciones ?? 0),
			requeridas
		},
		mi_respuesta: f.mi_respuesta ?? null,
		fin_visto: Boolean(f.mi_fin_visto),
		creado_en: iso(f.creado_en),
		actualizado_en: iso(f.cambio ?? f.actualizado_en)
	};
}
/**
* Emergencias que puede ver el usuario: el Guardián ve todas las de su sector (incluidas las pendientes);
* el vecino ve las activas/atendidas y las que él mismo reportó.
*/
async function listarEmergencias(db, c, filtro = {}) {
	const p = [c.usuarioId, c.sectorId];
	const cond = ["e.sector_id = $2"];
	if (!c.esGuardian) cond.push(`(e.estado IN ('activa','atendida') OR e.reportero_id = $1)`);
	if (filtro.estado) cond.push(`e.estado = $${p.push(filtro.estado)}`);
	if (filtro.id) cond.push(`e.id = $${p.push(filtro.id)}`);
	let sql = `${SELECT_EMERGENCIA} WHERE ${cond.join(" AND ")}`;
	if (filtro.desde) sql = `SELECT * FROM (${sql}) q WHERE q.cambio > $${p.push(filtro.desde)}`;
	const lista = (await db.query(`${sql} ORDER BY creado_en DESC`, p)).map((f) => aDto(f, c.requeridas));
	if (c.esGuardian) for (const e of lista) e.resumen = await resumen(db, e.id);
	return lista;
}
async function obtenerEmergencia(db, c, id) {
	const [e] = await listarEmergencias(db, c, { id });
	return e ?? null;
}
async function filaEmergencia(db, id) {
	const [e] = await db.query("SELECT id, sector_id, estado, reportero_id FROM emergencias WHERE id = $1", [id]);
	return e ?? null;
}
async function crearEmergencia(db, e) {
	return (await db.query(`INSERT INTO emergencias (id, sector_id, reportero_id, tipo, texto, foto, manzana) VALUES ($1, $2, $3, $4, $5, $6, $7)
		 ON CONFLICT (id) DO NOTHING RETURNING id`, [
		e.id,
		e.sectorId,
		e.reporteroId,
		e.tipo,
		e.texto,
		e.foto,
		e.manzana
	])).length > 0;
}
async function registrarConfirmacion(db, emergenciaId, guardianId) {
	await db.query("INSERT INTO emergencia_confirmaciones (emergencia_id, guardian_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [emergenciaId, guardianId]);
	const [{ n }] = await db.query("SELECT count(*)::int AS n FROM emergencia_confirmaciones WHERE emergencia_id = $1", [emergenciaId]);
	return n;
}
async function activarEmergencia(db, id, guardianId) {
	await db.query(`UPDATE emergencias SET estado = 'activa', confirmada_por = $2, confirmada_en = now() WHERE id = $1 AND estado = 'pendiente'`, [id, guardianId]);
}
async function descartarEmergencia(db, id, guardianId, motivo) {
	return (await db.query(`UPDATE emergencias SET estado = 'descartada', revisada_por = $2, revisada_en = now(), motivo_descarte = $3
		  WHERE id = $1 AND estado = 'pendiente' RETURNING id`, [
		id,
		guardianId,
		motivo
	])).length > 0;
}
async function atenderEmergencia(db, id, guardianId) {
	return (await db.query(`UPDATE emergencias SET estado = 'atendida', atendida_en = now(), cerrada_por = $2 WHERE id = $1 AND estado = 'activa' RETURNING id`, [id, guardianId])).length > 0;
}
async function guardarAcuse(db, emergenciaId, usuarioId, a) {
	await db.query(`INSERT INTO emergencia_acuses (emergencia_id, usuario_id, respuesta, fin_visto) VALUES ($1, $2, $3, coalesce($4, false))
		 ON CONFLICT (emergencia_id, usuario_id) DO UPDATE
		   SET respuesta = coalesce(EXCLUDED.respuesta, emergencia_acuses.respuesta),
		       fin_visto = coalesce($4, emergencia_acuses.fin_visto)`, [
		emergenciaId,
		usuarioId,
		a.respuesta ?? null,
		a.fin_visto ?? null
	]);
}
async function marcarReporteroVisto(db, id) {
	await db.query("UPDATE emergencias SET reportero_visto = true WHERE id = $1", [id]);
}
async function listarPedidos$1(db, c, filtro = {}) {
	const p = [c.sectorId];
	const cond = ["e.sector_id = $1"];
	if (filtro.emergenciaId) cond.push(`p.emergencia_id = $${p.push(filtro.emergenciaId)}`);
	if (filtro.id) cond.push(`p.id = $${p.push(filtro.id)}`);
	if (filtro.desde) cond.push(`p.actualizado_en > $${p.push(filtro.desde)}`);
	return (await db.query(`SELECT p.*, e.estado AS estado_emergencia, ${colsVecino("d", "d")}, ${colsVecino("h", "h")},
		        d.telefono AS tel_dueno, h.telefono AS tel_ayudante,
		        d.distrito AS d_distrito, d.direccion AS d_direccion, d.referencia AS d_referencia, d.lat_aprox AS d_lat, d.lng_aprox AS d_lng,
		        coalesce((SELECT array_agg(v.grupo ORDER BY v.grupo) FROM pedido_vulnerables v WHERE v.pedido_id = p.id), '{}') AS vulnerables
		   FROM pedidos_ayuda p
		   JOIN emergencias e ON e.id = p.emergencia_id
		   JOIN usuarios d ON d.id = p.dueno_id
		   LEFT JOIN usuarios h ON h.id = p.ayudante_id
		  WHERE ${cond.join(" AND ")} ORDER BY p.creado_en DESC`, p)).map((f) => {
		const soyDueno = f.dueno_id === c.usuarioId;
		const soyAyudante = f.ayudante_id === c.usuarioId;
		const telefono = f.estado !== "abierto" && f.ayudante_id ? soyDueno ? f.tel_ayudante : soyAyudante ? f.tel_dueno : null : null;
		const verDireccion = c.esGuardian && f.estado_emergencia === "activa";
		return {
			id: String(f.id),
			emergencia_id: String(f.emergencia_id),
			necesidad: String(f.necesidad),
			vulnerables: f.vulnerables ?? [],
			cuantas: Number(f.cuantas),
			texto: String(f.texto ?? ""),
			foto: f.foto ?? null,
			dueno_id: String(f.dueno_id),
			dueno: vecino(f, "d"),
			manzana: String(f.manzana).trim(),
			estado: f.estado,
			ayudante_id: f.ayudante_id ?? null,
			ayudante: vecino(f, "h"),
			ayudante_en: iso(f.ayudante_en),
			resuelto_en: iso(f.resuelto_en),
			contacto_telefono: telefono ?? null,
			direccion_exacta: verDireccion ? {
				distrito: f.d_distrito ?? null,
				direccion: f.d_direccion ?? null,
				referencia: f.d_referencia ?? null,
				lat_aprox: f.d_lat === null ? null : Number(f.d_lat),
				lng_aprox: f.d_lng === null ? null : Number(f.d_lng)
			} : null,
			creado_en: iso(f.creado_en),
			actualizado_en: iso(f.actualizado_en)
		};
	});
}
async function filaPedido(db, id) {
	const [p] = await db.query(`SELECT p.id, p.dueno_id, p.estado, p.ayudante_id, e.sector_id, e.estado AS estado_emergencia
		   FROM pedidos_ayuda p JOIN emergencias e ON e.id = p.emergencia_id WHERE p.id = $1`, [id]);
	return p ?? null;
}
async function crearPedido(db, p) {
	if (!(await db.query(`INSERT INTO pedidos_ayuda (id, emergencia_id, dueno_id, necesidad, cuantas, texto, foto, manzana)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING RETURNING id`, [
		p.id,
		p.emergenciaId,
		p.duenoId,
		p.necesidad,
		p.cuantas,
		p.texto,
		p.foto,
		p.manzana
	])).length) return false;
	for (const g of p.vulnerables) await db.query("INSERT INTO pedido_vulnerables (pedido_id, grupo) VALUES ($1, $2)", [p.id, g]);
	return true;
}
async function ayudarPedido(db, id, ayudanteId) {
	return (await db.query(`UPDATE pedidos_ayuda SET estado = 'en_camino', ayudante_id = $2, ayudante_en = now()
		  WHERE id = $1 AND estado = 'abierto' AND dueno_id <> $2 RETURNING id`, [id, ayudanteId])).length > 0;
}
async function resolverPedido$1(db, id) {
	await db.query(`UPDATE pedidos_ayuda SET estado = 'resuelto', resuelto_en = now() WHERE id = $1 AND estado <> 'resuelto'`, [id]);
}
async function listarGrupos(db, sectorId, filtro = {}) {
	return (await db.query(`SELECT * FROM grupos_apoyo WHERE sector_id = $1 AND ($2::text IS NULL OR recurso = $2)
		   AND ($3::timestamptz IS NULL OR creado_en > $3) ORDER BY creado_en, nombre`, [
		sectorId,
		filtro.recurso ?? null,
		filtro.desde ?? null
	])).map((g) => ({
		id: String(g.id),
		sector_id: String(g.sector_id),
		emoji: String(g.emoji),
		nombre: String(g.nombre),
		meta: String(g.meta ?? ""),
		recurso: g.recurso ?? null,
		manzana: g.manzana ? String(g.manzana).trim() : null,
		contacto_tipo: g.contacto_tipo,
		contacto_valor: String(g.contacto_valor),
		creado_en: iso(g.creado_en)
	}));
}
// src/lib/server/servicios/emergencias.ts
var TIPOS = [
	"inundacion",
	"incendio",
	"sismo",
	"servicios",
	"accidente",
	"otro"
];
var NECESIDADES = [
	"agua",
	"comida",
	"salud",
	"rescate",
	"refugio",
	"otro"
];
var VULNERABLES = [
	"adulto",
	"ninos",
	"discapacidad",
	"gestante",
	"mascotas"
];
var RECURSOS = [
	"agua",
	"refugio",
	"salud",
	"comida",
	"energia",
	"traslado"
];
var lector = (s) => ({
	usuarioId: s.usuarioId,
	sectorId: s.sectorId,
	esGuardian: s.esGuardian,
	requeridas: config().confirmacionesRequeridas
});
async function emergenciaDelSector(db, s, id) {
	const e = await filaEmergencia(db, uuid(id, "La emergencia"));
	if (!e || e.sector_id !== s.sectorId) throw err.noEncontrado("No encontramos esa emergencia en tu sector.");
	return e;
}
function soloGuardian(s) {
	if (!s.esGuardian) throw err.prohibido("Solo un Guardián del sector puede hacer esto.", "SOLO_GUARDIAN");
}
var leer = async (db, s, id) => await obtenerEmergencia(db, lector(s), id);
async function reportar(db, s, body) {
	const id = uuid(body.id, "El id");
	const creada = await crearEmergencia(db, {
		id,
		sectorId: s.sectorId,
		reporteroId: s.usuarioId,
		tipo: opcion(body.tipo, "tipo", TIPOS),
		texto: texto(body.texto, "El texto", {
			max: 200,
			opcional: true
		}),
		foto: foto(body.foto),
		manzana: s.manzana
	});
	const e = await filaEmergencia(db, id);
	if (!e || e.reportero_id !== s.usuarioId) throw err.conflicto("Ese id ya está en uso.", "ID_EN_USO");
	return {
		emergencia: await leer(db, s, id),
		creada
	};
}
async function confirmar(db, s, id) {
	soloGuardian(s);
	const e = await emergenciaDelSector(db, s, id);
	if (e.estado === "activa") return leer(db, s, e.id);
	if (e.estado !== "pendiente") throw err.conflicto("Este reporte ya fue revisado por otro Guardián.", "YA_REVISADA");
	if (await registrarConfirmacion(db, e.id, s.usuarioId) >= config().confirmacionesRequeridas) {
		await activarEmergencia(db, e.id, s.usuarioId);
		await guardarAcuse(db, e.id, s.usuarioId, { respuesta: "visto" });
	}
	return leer(db, s, e.id);
}
async function descartar(db, s, id, body) {
	soloGuardian(s);
	const e = await emergenciaDelSector(db, s, id);
	if (e.estado === "descartada") return leer(db, s, e.id);
	if (e.estado !== "pendiente") throw err.conflicto("Este reporte ya fue revisado por otro Guardián.", "YA_REVISADA");
	const motivo = texto(body.motivo, "El motivo", {
		max: 200,
		opcional: true
	}) || "Un Guardián revisó el reporte y no activó la emergencia.";
	if (motivo.length < 3) throw err.invalido("El motivo debe tener al menos 3 caracteres.");
	await descartarEmergencia(db, e.id, s.usuarioId, motivo);
	return leer(db, s, e.id);
}
async function atender(db, s, id) {
	soloGuardian(s);
	const e = await emergenciaDelSector(db, s, id);
	if (e.estado === "atendida") return leer(db, s, e.id);
	if (e.estado !== "activa") throw err.conflicto("Solo se puede cerrar una emergencia activa.", "NO_ACTIVA");
	await atenderEmergencia(db, e.id, s.usuarioId);
	await guardarAcuse(db, e.id, s.usuarioId, { fin_visto: true });
	return leer(db, s, e.id);
}
/** Mi respuesta a la alerta (visto / bien / ayuda), si ya vi el aviso de fin y, si la reporté, si vi la respuesta del Guardián. */
async function acusar(db, s, id, body) {
	const e = await emergenciaDelSector(db, s, id);
	const respuesta = body.respuesta === void 0 || body.respuesta === null ? null : opcion(body.respuesta, "respuesta", [
		"visto",
		"bien",
		"ayuda"
	]);
	const finVisto = body.fin_visto === void 0 ? void 0 : booleano(body.fin_visto, "fin_visto");
	if (body.reportero_visto !== void 0) {
		if (e.reportero_id !== s.usuarioId) throw err.prohibido("Solo quien reportó puede marcar esto.");
		if (booleano(body.reportero_visto, "reportero_visto")) await marcarReporteroVisto(db, e.id);
	}
	if (respuesta !== null || finVisto !== void 0) await guardarAcuse(db, e.id, s.usuarioId, {
		respuesta,
		fin_visto: finVisto
	});
}
async function pedirAyuda(db, s, emergenciaId, body) {
	const e = await emergenciaDelSector(db, s, emergenciaId);
	const id = uuid(body.id, "El id");
	const previo = await filaPedido(db, id);
	if (previo) {
		if (previo.dueno_id !== s.usuarioId) throw err.conflicto("Ese id ya está en uso.", "ID_EN_USO");
		return {
			pedido: (await listarPedidos$1(db, s, { id }))[0],
			creado: false
		};
	}
	if (e.estado !== "activa") throw err.conflicto("No hay una emergencia activa en tu sector.", "SIN_EMERGENCIA_ACTIVA");
	const vulnerables = body.vulnerables === void 0 ? [] : listaUnica(body.vulnerables, "Quiénes están contigo", VULNERABLES, 0, 5);
	await crearPedido(db, {
		id,
		emergenciaId: e.id,
		duenoId: s.usuarioId,
		necesidad: opcion(body.necesidad, "necesidad", NECESIDADES),
		cuantas: body.cuantas === void 0 ? 1 : entero(body.cuantas, "Cuántas personas", 1, 99),
		texto: texto(body.texto, "El texto", {
			max: 200,
			opcional: true
		}),
		foto: foto(body.foto),
		manzana: s.manzana,
		vulnerables
	});
	return {
		pedido: (await listarPedidos$1(db, s, { id }))[0],
		creado: true
	};
}
async function ayudar(db, s, id) {
	const p = await filaPedido(db, uuid(id, "El pedido"));
	if (!p || p.sector_id !== s.sectorId) throw err.noEncontrado();
	if (p.dueno_id === s.usuarioId) throw err.invalido("Es tu propio pedido.", "ES_TUYO");
	if (p.ayudante_id === s.usuarioId) return (await listarPedidos$1(db, s, { id: p.id }))[0];
	if (p.estado_emergencia !== "activa") throw err.conflicto("La emergencia ya terminó.", "SIN_EMERGENCIA_ACTIVA");
	if (!await ayudarPedido(db, p.id, s.usuarioId)) throw err.conflicto("Otro vecino ya va en camino a ayudar.", "YA_TIENE_AYUDA");
	return (await listarPedidos$1(db, s, { id: p.id }))[0];
}
async function resolverPedido(db, s, id) {
	const p = await filaPedido(db, uuid(id, "El pedido"));
	if (!p || p.sector_id !== s.sectorId) throw err.noEncontrado();
	if (p.dueno_id !== s.usuarioId) throw err.prohibido("Solo quien pidió la ayuda puede marcarla como recibida.");
	await resolverPedido$1(db, p.id);
	return (await listarPedidos$1(db, s, { id: p.id }))[0];
}
async function listarPedidos(db, s, emergenciaId) {
	return listarPedidos$1(db, s, { emergenciaId: (await emergenciaDelSector(db, s, emergenciaId)).id });
}
var recursoValido = (r) => r === void 0 || r === null || r === "" ? null : opcion(r, "recurso", RECURSOS);
export { descartar as a, pedirAyuda as c, resolverPedido as d, listarEmergencias as f, obtenerEmergencia as h, confirmar as i, recursoValido as l, listarPedidos$1 as m, atender as n, lector as o, listarGrupos as p, ayudar as r, listarPedidos as s, acusar as t, reportar as u };

//# sourceMappingURL=emergencias.js.map