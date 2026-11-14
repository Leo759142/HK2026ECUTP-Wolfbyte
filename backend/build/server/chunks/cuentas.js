import { n as err } from "./http.js";
import { a as revocarSesion, n as crearSesion } from "./sesion.js";
import { t as config } from "./config2.js";
import { i as obtenerUsuario, n as crearUsuario, r as idPorTelefono, t as actualizarUsuario } from "./usuarios.js";
import { i as fijarFundador, n as crearSector, o as obtenerSector, r as existeManzana, t as agregarGuardian } from "./sectores.js";
import { c as listaUnica, d as telefono, f as texto, l as manzana, m as uuid, n as coordenada, p as textoONull, s as foto, t as booleano, u as opcion } from "./validar.js";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
// src/lib/server/auth/otp.ts
/**
* Código de verificación por SMS (tabla `otp_codigos`). El código nunca se guarda en claro.
* - Modo demo (AYNI_DEMO=true): el código es AYNI_OTP_DEMO (1234 por defecto), como en el prototipo.
* - Producción: hace falta un proveedor de SMS (no configurado todavía → 503 SMS_NO_CONFIGURADO).
*/
var VIGENCIA_MS = 6e5;
var MAX_POR_HORA = 5;
var MAX_INTENTOS = 5;
var hashCodigo = (telefono, codigo) => createHmac("sha256", config().secreto).update(`${telefono}:${codigo}`).digest("hex");
async function solicitarCodigo(db, telefono) {
	const [{ n }] = await db.query(`SELECT count(*)::int AS n FROM otp_codigos WHERE telefono = $1 AND creado_en > now() - interval '1 hour'`, [telefono]);
	if (n >= MAX_POR_HORA) throw err.limite("Pediste muchos códigos. Espera una hora e inténtalo otra vez.");
	const cfg = config();
	if (!cfg.demo) throw err.noDisponible("El envío de SMS aún no está configurado en este servidor.", "SMS_NO_CONFIGURADO");
	const codigo = cfg.demo ? cfg.otpDemo : String(randomInt(0, 1e4)).padStart(4, "0");
	await db.query("UPDATE otp_codigos SET usado = true WHERE telefono = $1 AND NOT usado", [telefono]);
	await db.query("INSERT INTO otp_codigos (telefono, codigo_hash, expira_en) VALUES ($1, $2, $3)", [
		telefono,
		hashCodigo(telefono, codigo),
		new Date(Date.now() + VIGENCIA_MS)
	]);
	return { demo: cfg.demo };
}
/** Devuelve true si el código es correcto (y lo marca como usado). */
async function verificarCodigo(db, telefono, codigo) {
	const [otp] = await db.query(`SELECT id, codigo_hash, intentos FROM otp_codigos
		  WHERE telefono = $1 AND NOT usado AND expira_en > now()
		  ORDER BY creado_en DESC LIMIT 1`, [telefono]);
	if (!otp) throw err.noAutorizado("El código venció o no lo pediste. Toca \"Cambiar número\" y pide uno nuevo.", "CODIGO_VENCIDO");
	if (otp.intentos >= MAX_INTENTOS) {
		await db.query("UPDATE otp_codigos SET usado = true WHERE id = $1", [otp.id]);
		throw err.limite("Demasiados intentos. Pide un código nuevo.");
	}
	const esperado = Buffer.from(otp.codigo_hash, "hex");
	const recibido = Buffer.from(hashCodigo(telefono, codigo), "hex");
	if (!(esperado.length === recibido.length && timingSafeEqual(esperado, recibido))) {
		await db.query("UPDATE otp_codigos SET intentos = intentos + 1 WHERE id = $1", [otp.id]);
		return false;
	}
	await db.query("UPDATE otp_codigos SET usado = true WHERE id = $1", [otp.id]);
	return true;
}
// src/lib/server/servicios/cuentas.ts
var IDIOMAS = [
	"es",
	"en",
	"qu"
];
var PLATAFORMAS = [
	"android",
	"ios",
	"web",
	"otro"
];
async function pedirCodigo(db, body) {
	return solicitarCodigo(db, telefono(body.telefono));
}
async function verificar(db, body) {
	const telefono$2 = telefono(body.telefono);
	const codigo = texto(body.codigo, "El código", {
		min: 4,
		max: 6
	});
	const plataforma = body.plataforma ? opcion(body.plataforma, "plataforma", PLATAFORMAS) : "web";
	if (!await verificarCodigo(db, telefono$2, codigo)) throw err.noAutorizado("Código incorrecto. Revisa el SMS e inténtalo otra vez.", "CODIGO_INCORRECTO");
	const usuarioId = await idPorTelefono(db, telefono$2);
	if (usuarioId) {
		const { token, expira } = await crearSesion(db, {
			usuarioId,
			telefono: telefono$2,
			proposito: "sesion",
			plataforma
		});
		return {
			tipo: "sesion",
			token,
			expira,
			usuario: await obtenerUsuario(db, usuarioId)
		};
	}
	const { token, expira } = await crearSesion(db, {
		usuarioId: null,
		telefono: telefono$2,
		proposito: "registro",
		plataforma
	});
	return {
		tipo: "registro",
		token,
		expira
	};
}
/** Crea la cuenta con el teléfono ya verificado. Con `sector_nuevo` crea el sector y el vecino es su primer Guardián. */
async function registrar(db, registro, body) {
	const nombre = texto(body.nombre, "El nombre", {
		min: 2,
		max: 40
	});
	const apellido = texto(body.apellido, "El apellido", {
		max: 40,
		opcional: true
	});
	const manzana$1 = manzana(body.manzana);
	const datos = {
		lat: coordenada(body.lat_aprox, "La latitud", 90),
		lng: coordenada(body.lng_aprox, "La longitud", 180),
		foto: foto(body.foto),
		distrito: textoONull(body.distrito, "El distrito", { max: 60 }),
		direccion: textoONull(body.direccion, "La dirección", { max: 120 }),
		referencia: textoONull(body.referencia, "La referencia", { max: 120 }),
		idioma: body.idioma ? opcion(body.idioma, "idioma", IDIOMAS) : "es"
	};
	if (datos.lat === null !== (datos.lng === null)) throw err.invalido("Envía latitud y longitud juntas.");
	const plataforma = body.plataforma ? opcion(body.plataforma, "plataforma", PLATAFORMAS) : "web";
	const nuevo = body.sector_nuevo;
	if (!nuevo && !body.sector_id) throw err.invalido("Elige tu sector o crea uno nuevo.");
	return db.transaccion(async (tx) => {
		if (await idPorTelefono(tx, registro.telefono)) throw err.conflicto("Ese número ya tiene cuenta. Vuelve e ingresa con \"Ya tengo cuenta\".", "TELEFONO_REGISTRADO");
		let sectorId;
		if (nuevo) {
			if (typeof nuevo !== "object" || Array.isArray(nuevo)) throw err.invalido("El sector nuevo no es válido.");
			sectorId = uuid(nuevo.id, "El id del sector");
			const manzanas = listaUnica(nuevo.manzanas, "Las manzanas", [
				"A",
				"B",
				"C",
				"D",
				"E",
				"F",
				"G",
				"H",
				"I",
				"J"
			], 1, 10).sort();
			if (!manzanas.includes(manzana$1)) throw err.invalido("Tu manzana debe estar entre las del sector.");
			const area = nuevo.area_geojson && typeof nuevo.area_geojson === "object" ? nuevo.area_geojson : null;
			await crearSector(tx, {
				id: sectorId,
				nombre: texto(nuevo.nombre, "El nombre del sector", {
					min: 3,
					max: 80
				}),
				manzanas,
				area
			});
		} else {
			sectorId = uuid(body.sector_id, "El sector");
			if (!await obtenerSector(tx, sectorId, false)) throw err.invalido("Ese sector no existe.", "SECTOR_NO_EXISTE");
			if (!await existeManzana(tx, sectorId, manzana$1)) throw err.invalido("Esa manzana no pertenece al sector.");
		}
		const usuarioId = await crearUsuario(tx, {
			id: body.id ? uuid(body.id, "El id") : void 0,
			nombre,
			apellido,
			telefono: registro.telefono,
			sectorId,
			manzana: manzana$1,
			...datos,
			invitacion: nuevo ? "fundador" : null
		});
		if (nuevo) await fijarFundador(tx, sectorId, usuarioId);
		await revocarSesion(tx, registro.sesionId);
		const { token, expira } = await crearSesion(tx, {
			usuarioId,
			telefono: registro.telefono,
			proposito: "sesion",
			plataforma
		});
		return {
			tipo: "sesion",
			token,
			expira,
			usuario: await obtenerUsuario(tx, usuarioId)
		};
	});
}
async function actualizarPerfil(db, s, body) {
	const c = {};
	if ("mostrar_nombre_completo" in body) c.mostrar_nombre_completo = booleano(body.mostrar_nombre_completo, "mostrar_nombre_completo");
	if ("idioma" in body) c.idioma = opcion(body.idioma, "idioma", IDIOMAS);
	if ("letra_grande" in body) c.letra_grande = booleano(body.letra_grande, "letra_grande");
	if ("foto" in body) c.foto = foto(body.foto);
	if ("distrito" in body) c.distrito = textoONull(body.distrito, "El distrito", { max: 60 });
	if ("direccion" in body) c.direccion = textoONull(body.direccion, "La dirección", { max: 120 });
	if ("referencia" in body) c.referencia = textoONull(body.referencia, "La referencia", { max: 120 });
	if ("manzana" in body) {
		const m = manzana(body.manzana);
		if (!await existeManzana(db, s.sectorId, m)) throw err.invalido("Esa manzana no pertenece a tu sector.");
		c.manzana = m;
	}
	await actualizarUsuario(db, s.usuarioId, c);
	return await obtenerUsuario(db, s.usuarioId);
}
/** La invitación a Guardián se ofrece a los 60 días en AYNI (data.DIAS_PARA_GUARDIAN). */
async function responderInvitacion(db, s, body) {
	const respuesta = opcion(body.respuesta, "respuesta", ["aceptada", "despues"]);
	const yo = await obtenerUsuario(db, s.usuarioId);
	if (respuesta === "aceptada") {
		if (!yo.camino_guardian.elegible) throw err.conflicto(`Aún no cumples 60 días en AYNI. Te invitaremos cuando llegues.`, "AUN_NO_ELEGIBLE");
		await agregarGuardian(db, s.sectorId, s.usuarioId);
	}
	await actualizarUsuario(db, s.usuarioId, { invitacion_guardian: respuesta });
	return await obtenerUsuario(db, s.usuarioId);
}
export { verificar as a, responderInvitacion as i, pedirCodigo as n, registrar as r, actualizarPerfil as t };

//# sourceMappingURL=cuentas.js.map