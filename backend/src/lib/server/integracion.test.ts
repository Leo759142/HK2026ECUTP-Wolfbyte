/**
 * Tests de integración contra un PostgreSQL REAL (TEST_DATABASE_URL) con el esquema de las migraciones,
 * sus triggers y vistas, y los datos de demostración. No usan mocks de la base.
 * ATENCIÓN: vacían el esquema public de TEST_DATABASE_URL en cada corrida. Si no está configurada, se saltan.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { config, configurarParaTests } from './config.ts';
import { migrar } from './db/migrar.ts';
import { crearDb, type Db } from './db/index.ts';
import { asegurarDatosDemo, DEMO } from './db/seed-demo.ts';
import { crearSesion, leerSesion, type SesionActual } from './auth/sesion.ts';
import { aErrorApi, ErrorApi } from './http.ts';
import { uuidDe } from './ids.ts';
import * as cuentas from './servicios/cuentas.ts';
import * as srv from './servicios/servicios.ts';
import * as fav from './servicios/favores.ts';
import * as emer from './servicios/emergencias.ts';
import * as sync from './servicios/sync.ts';
import { listarServicios } from './repositorios/servicios.ts';

const URL_TEST = (config(), process.env.TEST_DATABASE_URL ?? "");

describe.skipIf(!URL_TEST)("Integración con PostgreSQL (TEST_DATABASE_URL)", () => {
let db: Db;
const id = () => crypto.randomUUID();

async function sesionDe(nombre: string): Promise<{ s: SesionActual; token: string }> {
	const usuarioId = uuidDe(nombre);
	const [u] = await db.query<{ telefono: string }>('SELECT telefono FROM usuarios WHERE id = $1', [usuarioId]);
	const { token } = await crearSesion(db, { usuarioId, telefono: u.telefono, proposito: 'sesion' });
	return { s: (await leerSesion(db, token)).sesion!, token };
}

async function falla(p: Promise<unknown>): Promise<ErrorApi> {
	try {
		await p;
	} catch (e) {
		// Igual que las rutas: los errores de la base (triggers, restricciones) se traducen a { codigo, mensaje }.
		const ea = aErrorApi(e);
		if (ea.status >= 500) throw e;
		return ea;
	}
	throw new Error('Se esperaba un error');
}

beforeAll(async () => {
	configurarParaTests({ demo: true, otpDemo: '1234', confirmacionesRequeridas: 1 });
	db = await crearDb({ url: URL_TEST, migrar: false });
	await db.exec('DROP SCHEMA public CASCADE; CREATE SCHEMA public');
	await migrar(db);
	await asegurarDatosDemo(db);
});

afterAll(async () => {
	await db?.cerrar();
});

describe('Esquema y datos de demostración', () => {
	it('aplica las migraciones y carga el sector de ejemplo', async () => {
		const [{ n }] = await db.query<{ n: number }>('SELECT count(*)::int AS n FROM schema_migraciones');
		expect(n).toBe(2);
		const [{ u }] = await db.query<{ u: number }>('SELECT count(*)::int AS u FROM usuarios');
		expect(u).toBe(10);
		const [sosp] = await db.query<{ moderacion: string }>('SELECT moderacion FROM servicios WHERE id = $1', [uuidDe('s-sospechoso')]);
		expect(sosp.moderacion).toBe('en_revision'); // trigger: 3 reportes la ocultan sola
	});
});

describe('Autenticación (OTP + sesión)', () => {
	it('Rosa entra con su celular y el código de demo', async () => {
		const envio = await cuentas.pedirCodigo(db, { telefono: '900000001' });
		expect(envio.demo).toBe(true);
		const r = await cuentas.verificar(db, { telefono: '900000001', codigo: '1234' });
		expect(r.tipo).toBe('sesion');
		expect(r.usuario?.id).toBe(DEMO.rosa);
		const { sesion } = await leerSesion(db, r.token);
		expect(sesion?.usuarioId).toBe(DEMO.rosa);
		expect(sesion?.esGuardian).toBe(false);
	});

	it('rechaza un código incorrecto y no revela si el número existe', async () => {
		await cuentas.pedirCodigo(db, { telefono: '900000002' });
		const e = await falla(cuentas.verificar(db, { telefono: '900000002', codigo: '9999' }));
		expect(e.status).toBe(401);
		const [otp] = await db.query<{ intentos: number }>('SELECT intentos FROM otp_codigos WHERE telefono = $1 ORDER BY creado_en DESC LIMIT 1', ['51900000002']);
		expect(otp.intentos).toBe(1);
	});

	it('un número nuevo recibe un token de registro y crea su cuenta en un sector existente', async () => {
		await cuentas.pedirCodigo(db, { telefono: '987654321' });
		const r = await cuentas.verificar(db, { telefono: '987654321', codigo: '1234' });
		expect(r.tipo).toBe('registro');
		const { registro, sesion } = await leerSesion(db, r.token);
		expect(sesion).toBeNull();
		const cuenta = await cuentas.registrar(db, registro!, { nombre: 'Lucía', apellido: 'Ramos', sector_id: DEMO.sector, manzana: 'C' });
		expect(cuenta.usuario?.telefono).toBe('51987654321');
		expect(cuenta.usuario?.es_guardian).toBe(false);
		// El token de registro ya no sirve
		expect((await leerSesion(db, r.token)).registro).toBeNull();
		// No se puede registrar dos veces el mismo número
		const { token } = await crearSesion(db, { usuarioId: null, telefono: '51987654321', proposito: 'registro' });
		const e = await falla(cuentas.registrar(db, (await leerSesion(db, token)).registro!, { nombre: 'Otra', apellido: 'X', sector_id: DEMO.sector, manzana: 'A' }));
		expect(e.status).toBe(409);
	});

	it('quien crea un sector nuevo es su primer Guardián', async () => {
		await cuentas.pedirCodigo(db, { telefono: '912345678' });
		const r = await cuentas.verificar(db, { telefono: '912345678', codigo: '1234' });
		const sectorId = id();
		const cuenta = await cuentas.registrar(db, (await leerSesion(db, r.token)).registro!, {
			nombre: 'Julio',
			apellido: 'Vega',
			manzana: 'B',
			sector_nuevo: { id: sectorId, nombre: 'Villa Nueva · Sector 1', manzanas: ['A', 'B', 'C', 'D'] }
		});
		expect(cuenta.usuario?.es_guardian).toBe(true);
		expect(cuenta.usuario?.invitacion_guardian).toBe('fundador');
		const [s] = await db.query<{ fundador_id: string }>('SELECT fundador_id FROM sectores WHERE id = $1', [sectorId]);
		expect(s.fundador_id).toBe(cuenta.usuario?.id);
	});
});

describe('Servicios: ownership, Visto Bueno y conflictos', () => {
	it('publica, impide que otro lo edite y aplica "la última escritura gana"', async () => {
		const { s: rosa } = await sesionDe('u-rosa');
		const { s: ana } = await sesionDe('u-ana');
		const sid = id();
		const { servicio, creado } = await db.transaccion((tx) =>
			srv.crear(tx, rosa, { id: sid, clase: 'servicio', categoria: 'comida', titulo: 'Tamales', descripcion: 'Tamales caseros los domingos.', horario: 'Domingos', dueno_id: uuidDe('u-ana') })
		);
		expect(creado).toBe(true);
		expect(servicio.dueno_id).toBe(DEMO.rosa); // el dueño sale de la sesión, no del cuerpo
		expect((await falla(srv.editar(db, ana, sid, { titulo: 'Robado' }))).status).toBe(403);
		const viejo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
		expect((await falla(srv.editar(db, rosa, sid, { titulo: 'Tamales!', actualizado_en: viejo }))).codigo).toBe('DESACTUALIZADO');
		const editado = await srv.editar(db, rosa, sid, { estado: 'pausado', actualizado_en: new Date(Date.now() + 1000).toISOString() });
		expect(editado.estado).toBe('pausado');
		// Pausado: Ana no lo ve; Rosa sí
		const deAna = await listarServicios(db, { sectorId: ana.sectorId, yo: ana.usuarioId, miManzana: ana.manzana });
		expect(deAna.some((x) => x.id === sid)).toBe(false);
		const deRosa = await listarServicios(db, { sectorId: rosa.sectorId, yo: rosa.usuarioId, miManzana: rosa.manzana });
		expect(deRosa.some((x) => x.id === sid)).toBe(true);
	});

	it('solo puede dar Visto Bueno quien fue atendido, una vez', async () => {
		const { s: rosa } = await sesionDe('u-rosa');
		const servicioId = uuidDe('s-marco');
		const sinAtender = await falla(db.transaccion((tx) => srv.recomendar(tx, rosa, servicioId, { id: id(), etiquetas: ['puntual'] })));
		expect(sinAtender.status).toBe(403);
		const contacto = await db.transaccion((tx) => srv.contactar(tx, rosa, servicioId));
		expect(contacto.whatsapp_url).toMatch(/^https:\/\/wa\.me\/519/);
		await srv.responderContacto(db, rosa, contacto.id, { atendido: true });
		const { reco } = await db.transaccion((tx) => srv.recomendar(tx, rosa, servicioId, { id: id(), etiquetas: ['puntual', 'limpio'], comentario: 'Muy bien' }));
		expect(reco.etiquetas.sort()).toEqual(['limpio', 'puntual']);
		const dos = await falla(db.transaccion((tx) => srv.recomendar(tx, rosa, servicioId, { id: id(), etiquetas: ['rapido'] })));
		expect(dos.status).toBe(409);
		const sv = await srv.detalle(db, rosa, servicioId);
		expect(sv.total_vistos_buenos).toBe(13); // 12 de base + 1
	});
});

describe('Cadena de Favores', () => {
	it('reserva: gana el primero; "Listo" de ambos cierra el favor', async () => {
		const { s: rosa } = await sesionDe('u-rosa');
		const { s: ana } = await sesionDe('u-ana');
		const { s: jorge } = await sesionDe('u-jorge');
		const fid = uuidDe('f-escalera'); // de Jorge
		const reservado = await db.transaccion((tx) => fav.reservar(tx, rosa, fid));
		expect(reservado.estado).toBe('reservado');
		expect(reservado.whatsapp_url).toMatch(/^https:\/\/wa\.me\//);
		expect((await falla(db.transaccion((tx) => fav.reservar(tx, ana, fid)))).codigo).toBe('RESERVA_OCUPADA');
		expect((await falla(fav.editar(db, jorge, fid, { titulo: 'Escalera' }))).codigo).toBe('NO_EDITABLE');
		expect((await fav.listo(db, rosa, fid)).estado).toBe('reservado');
		expect((await fav.listo(db, jorge, fid)).estado).toBe('cerrado');
		expect((await falla(fav.listo(db, ana, fid))).status).toBe(403);
	});

	it('una reserva de más de 1 hora se libera sola', async () => {
		const { s: rosa } = await sesionDe('u-rosa');
		const fid = uuidDe('f-ladrillos');
		await fav.reservar(db, rosa, fid);
		await db.query(`UPDATE favores SET reservado_en = now() - interval '61 minutes' WHERE id = $1`, [fid]);
		expect((await fav.detalle(db, rosa, fid)).estado).toBe('disponible');
	});

	it('3 reportes ocultan la publicación hasta que un Guardián decide', async () => {
		const fid = uuidDe('f-taladro'); // de Pedro
		for (const v of ['u-rosa', 'u-ana', 'u-jorge']) {
			const { s } = await sesionDe(v);
			await fav.reportar(db, s, { id: id(), objeto_tipo: 'favor', objeto_id: fid, motivo: 'falso' });
		}
		const [f] = await db.query<{ moderacion: string }>('SELECT moderacion FROM favores WHERE id = $1', [fid]);
		expect(f.moderacion).toBe('en_revision');
		const { s: rosa } = await sesionDe('u-rosa');
		expect((await falla(fav.pendientes(db, rosa))).status).toBe(403);
		const { s: carmen } = await sesionDe('u-carmen'); // Guardiana
		expect((await fav.pendientes(db, carmen)).some((p) => p.objeto_id === fid)).toBe(true);
		await fav.resolver(db, carmen, { objeto_tipo: 'favor', objeto_id: fid, decision: 'aprobar' });
		const [g] = await db.query<{ moderacion: string }>('SELECT moderacion FROM favores WHERE id = $1', [fid]);
		expect(g.moderacion).toBe('visible');
	});
});

describe('Modo emergencia y privacidad', () => {
	it('flujo completo: reporte → Guardián confirma → pedido → voy yo → atendida', async () => {
		const { s: rosa } = await sesionDe('u-rosa');
		const { s: ana } = await sesionDe('u-ana');
		const { s: carmen } = await sesionDe('u-carmen');
		const eid = id();
		await emer.reportar(db, rosa, { id: eid, tipo: 'inundacion', texto: 'Se desbordó la acequia' });
		expect((await falla(emer.confirmar(db, rosa, eid))).codigo).toBe('SOLO_GUARDIAN');
		const activa = await emer.confirmar(db, carmen, eid);
		expect(activa.estado).toBe('activa');
		expect(activa.confirmaciones).toEqual({ actuales: 1, requeridas: 1 });

		const { pedido } = await emer.pedirAyuda(db, rosa, eid, { id: id(), necesidad: 'agua', vulnerables: ['adulto'], cuantas: 3 });
		expect(pedido.contacto_telefono).toBeNull();
		const enCamino = await emer.ayudar(db, ana, pedido.id);
		expect(enCamino.estado).toBe('en_camino');
		expect(enCamino.contacto_telefono).toBe('51900000001'); // Ana ve el número de Rosa al aceptar
		const { s: pedro } = await sesionDe('u-pedro');
		expect((await falla(emer.ayudar(db, pedro, pedido.id))).codigo).toBe('YA_TIENE_AYUDA');
		const [vistoPorPedro] = await emer.listarPedidos(db, pedro, eid);
		expect(vistoPorPedro.contacto_telefono).toBeNull(); // un tercero no ve teléfonos
		expect(vistoPorPedro.direccion_exacta).toBeNull(); // ni la dirección
		const [vistoPorCarmen] = await emer.listarPedidos(db, carmen, eid);
		expect(vistoPorCarmen.direccion_exacta).not.toBeNull(); // la Guardiana sí, durante la emergencia

		await emer.acusar(db, ana, eid, { respuesta: 'bien' });
		expect((await falla(emer.acusar(db, ana, eid, { reportero_visto: true }))).status).toBe(403);
		const atendida = await emer.atender(db, carmen, eid);
		expect(atendida.estado).toBe('atendida');
		expect(atendida.resumen?.a_salvo).toBe(1);
	});

	it('el vecino no ve emergencias pendientes de otros; el Guardián sí', async () => {
		const { s: ana } = await sesionDe('u-ana');
		const { s: pedro } = await sesionDe('u-pedro');
		const { s: carmen } = await sesionDe('u-carmen');
		const eid = id();
		await emer.reportar(db, ana, { id: eid, tipo: 'incendio' });
		const leer = async (s: SesionActual) => (await sync.pull(db, s, null)).cambios.emergencias.some((e) => e.id === eid);
		expect(await leer(ana)).toBe(true);
		expect(await leer(pedro)).toBe(false);
		expect(await leer(carmen)).toBe(true);
		const desc = await emer.descartar(db, carmen, eid, { motivo: '' });
		expect(desc.motivo_descarte).toBe(emer.MOTIVO_POR_DEFECTO);
	});
});

describe('Sincronización offline', () => {
	it('push es idempotente por op_id y una operación rechazada no bloquea a las demás', async () => {
		const { s: rosa, token } = await sesionDe('u-rosa');
		const opOk = id();
		const opMal = id();
		const servicioId = id();
		const ops = {
			operaciones: [
				{ op_id: opOk, entidad: 'servicios', operacion: 'crear', creado_en: new Date().toISOString(), payload: { id: servicioId, clase: 'producto', categoria: 'comida', titulo: 'Queque', descripcion: 'Queque de naranja por porciones.', horario: 'Sábados' } },
				{ op_id: opMal, entidad: 'favores', operacion: 'actualizar', creado_en: new Date().toISOString(), payload: { id: uuidDe('f-excel'), accion: 'listo' } }
			]
		};
		const r1 = await sync.push(db, rosa, token, ops);
		expect(r1.resultados.map((r) => r.resultado)).toEqual(['aplicada', 'rechazada']);
		const r2 = await sync.push(db, rosa, token, ops);
		expect(r2.resultados.map((r) => r.resultado)).toEqual(['duplicada', 'rechazada']);
		expect(r2.resultados[1].codigo).toBe(r1.resultados[1].codigo);
		const [{ n }] = await db.query<{ n: number }>('SELECT count(*)::int AS n FROM servicios WHERE id = $1', [servicioId]);
		expect(n).toBe(1);
	});

	it('pull trae los cambios del sector y oculta lo que el vecino no debe ver', async () => {
		const { s: rosa } = await sesionDe('u-rosa');
		// pull usa un margen de 2 s hacia atrás: esperamos a que los cambios de los tests anteriores queden fuera.
		await new Promise((r) => setTimeout(r, 2100));
		const todo = await sync.pull(db, rosa, null);
		expect(todo.completo).toBe(true);
		expect(todo.cambios.yo?.id).toBe(DEMO.rosa);
		expect(todo.cambios.servicios.some((s) => s.id === uuidDe('s-sospechoso'))).toBe(false);
		expect(todo.eliminados.servicios).toContain(uuidDe('s-sospechoso'));
		expect(todo.cambios.usuarios.every((u) => !('telefono' in u))).toBe(true);
		const despues = await sync.pull(db, rosa, todo.hasta);
		expect(despues.completo).toBe(false);
		expect(despues.cambios.servicios.length).toBeLessThan(todo.cambios.servicios.length);
	});
});
});
