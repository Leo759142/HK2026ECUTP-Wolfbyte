/** Casos de uso de acceso y cuenta: código SMS, registro (con o sin sector nuevo), perfil e invitación a Guardián. */
import type { Consulta, Db } from '../db/index.ts';
import { err } from '../http.ts';
import { crearSesion, revocarSesion, type Plataforma, type SesionActual } from '../auth/sesion.ts';
import { solicitarCodigo, verificarCodigo } from '../auth/otp.ts';
import * as usuarios from '../repositorios/usuarios.ts';
import * as sectores from '../repositorios/sectores.ts';
import { DIAS_PARA_GUARDIAN } from '../dto.ts';
import * as v from '../validar.ts';

const IDIOMAS = ['es', 'en', 'qu'] as const;
const PLATAFORMAS = ['android', 'ios', 'web', 'otro'] as const;

export async function pedirCodigo(db: Db, body: v.Cuerpo) {
	const telefono = v.telefono(body.telefono);
	return solicitarCodigo(db, telefono);
}

export interface ResultadoAuth {
	tipo: 'sesion' | 'registro';
	token: string;
	expira: Date;
	usuario?: usuarios.UsuarioDto;
}

export async function verificar(db: Db, body: v.Cuerpo): Promise<ResultadoAuth> {
	const telefono = v.telefono(body.telefono);
	const codigo = v.texto(body.codigo, 'El código', { min: 4, max: 6 });
	const plataforma = (body.plataforma ? v.opcion(body.plataforma, 'plataforma', PLATAFORMAS) : 'web') as Plataforma;
	if (!(await verificarCodigo(db, telefono, codigo))) {
		throw err.noAutorizado('Código incorrecto. Revisa el SMS e inténtalo otra vez.', 'CODIGO_INCORRECTO');
	}
	const usuarioId = await usuarios.idPorTelefono(db, telefono);
	if (usuarioId) {
		const { token, expira } = await crearSesion(db, { usuarioId, telefono, proposito: 'sesion', plataforma });
		return { tipo: 'sesion', token, expira, usuario: (await usuarios.obtenerUsuario(db, usuarioId))! };
	}
	const { token, expira } = await crearSesion(db, { usuarioId: null, telefono, proposito: 'registro', plataforma });
	return { tipo: 'registro', token, expira };
}

/** Crea la cuenta con el teléfono ya verificado. Con `sector_nuevo` crea el sector y el vecino es su primer Guardián. */
export async function registrar(db: Db, registro: { sesionId: string; telefono: string }, body: v.Cuerpo): Promise<ResultadoAuth> {
	const nombre = v.texto(body.nombre, 'El nombre', { min: 2, max: 40 });
	const apellido = v.texto(body.apellido, 'El apellido', { max: 40, opcional: true });
	const manzana = v.manzana(body.manzana);
	const datos = {
		lat: v.coordenada(body.lat_aprox, 'La latitud', 90),
		lng: v.coordenada(body.lng_aprox, 'La longitud', 180),
		foto: v.foto(body.foto),
		distrito: v.textoONull(body.distrito, 'El distrito', { max: 60 }),
		direccion: v.textoONull(body.direccion, 'La dirección', { max: 120 }),
		referencia: v.textoONull(body.referencia, 'La referencia', { max: 120 }),
		idioma: (body.idioma ? v.opcion(body.idioma, 'idioma', IDIOMAS) : 'es') as 'es' | 'en' | 'qu'
	};
	if ((datos.lat === null) !== (datos.lng === null)) throw err.invalido('Envía latitud y longitud juntas.');
	const plataforma = (body.plataforma ? v.opcion(body.plataforma, 'plataforma', PLATAFORMAS) : 'web') as Plataforma;

	const nuevo = body.sector_nuevo as v.Cuerpo | undefined;
	if (!nuevo && !body.sector_id) throw err.invalido('Elige tu sector o crea uno nuevo.');

	return db.transaccion(async (tx) => {
		if (await usuarios.idPorTelefono(tx, registro.telefono)) {
			throw err.conflicto('Ese número ya tiene cuenta. Vuelve e ingresa con "Ya tengo cuenta".', 'TELEFONO_REGISTRADO');
		}
		let sectorId: string;
		if (nuevo) {
			if (typeof nuevo !== 'object' || Array.isArray(nuevo)) throw err.invalido('El sector nuevo no es válido.');
			sectorId = v.uuid(nuevo.id, 'El id del sector');
			const manzanas = v.listaUnica(nuevo.manzanas, 'Las manzanas', ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'], 1, 10).sort();
			if (!manzanas.includes(manzana as (typeof manzanas)[number])) throw err.invalido('Tu manzana debe estar entre las del sector.');
			const area = nuevo.area_geojson && typeof nuevo.area_geojson === 'object' ? (nuevo.area_geojson as Record<string, unknown>) : null;
			await sectores.crearSector(tx, { id: sectorId, nombre: v.texto(nuevo.nombre, 'El nombre del sector', { min: 3, max: 80 }), manzanas, area });
		} else {
			sectorId = v.uuid(body.sector_id, 'El sector');
			if (!(await sectores.obtenerSector(tx, sectorId, false))) throw err.invalido('Ese sector no existe.', 'SECTOR_NO_EXISTE');
			if (!(await sectores.existeManzana(tx, sectorId, manzana))) throw err.invalido('Esa manzana no pertenece al sector.');
		}
		const usuarioId = await usuarios.crearUsuario(tx, {
			id: body.id ? v.uuid(body.id, 'El id') : undefined,
			nombre,
			apellido,
			telefono: registro.telefono,
			sectorId,
			manzana,
			...datos,
			invitacion: nuevo ? 'fundador' : null
		});
		if (nuevo) await sectores.fijarFundador(tx, sectorId, usuarioId);
		await revocarSesion(tx, registro.sesionId);
		const { token, expira } = await crearSesion(tx, { usuarioId, telefono: registro.telefono, proposito: 'sesion', plataforma });
		return { tipo: 'sesion' as const, token, expira, usuario: (await usuarios.obtenerUsuario(tx, usuarioId))! };
	});
}

export async function actualizarPerfil(db: Consulta, s: SesionActual, body: v.Cuerpo): Promise<usuarios.UsuarioDto> {
	const c: usuarios.CambiosUsuario = {};
	if ('mostrar_nombre_completo' in body) c.mostrar_nombre_completo = v.booleano(body.mostrar_nombre_completo, 'mostrar_nombre_completo');
	if ('idioma' in body) c.idioma = v.opcion(body.idioma, 'idioma', IDIOMAS);
	if ('letra_grande' in body) c.letra_grande = v.booleano(body.letra_grande, 'letra_grande');
	if ('foto' in body) c.foto = v.foto(body.foto);
	if ('distrito' in body) c.distrito = v.textoONull(body.distrito, 'El distrito', { max: 60 });
	if ('direccion' in body) c.direccion = v.textoONull(body.direccion, 'La dirección', { max: 120 });
	if ('referencia' in body) c.referencia = v.textoONull(body.referencia, 'La referencia', { max: 120 });
	if ('manzana' in body) {
		const m = v.manzana(body.manzana);
		if (!(await sectores.existeManzana(db, s.sectorId, m))) throw err.invalido('Esa manzana no pertenece a tu sector.');
		c.manzana = m;
	}
	await usuarios.actualizarUsuario(db, s.usuarioId, c);
	return (await usuarios.obtenerUsuario(db, s.usuarioId))!;
}

/** La invitación a Guardián se ofrece a los 60 días en AYNI (data.DIAS_PARA_GUARDIAN). */
export async function responderInvitacion(db: Consulta, s: SesionActual, body: v.Cuerpo): Promise<usuarios.UsuarioDto> {
	const respuesta = v.opcion(body.respuesta, 'respuesta', ['aceptada', 'despues'] as const);
	const yo = (await usuarios.obtenerUsuario(db, s.usuarioId))!;
	if (respuesta === 'aceptada') {
		if (!yo.camino_guardian.elegible) {
			throw err.conflicto(`Aún no cumples ${DIAS_PARA_GUARDIAN} días en AYNI. Te invitaremos cuando llegues.`, 'AUN_NO_ELEGIBLE');
		}
		await sectores.agregarGuardian(db, s.sectorId, s.usuarioId);
	}
	await usuarios.actualizarUsuario(db, s.usuarioId, { invitacion_guardian: respuesta });
	return (await usuarios.obtenerUsuario(db, s.usuarioId))!;
}
