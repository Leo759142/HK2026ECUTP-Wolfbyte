/**
 * Casos de uso del modo emergencia (frontend/src/screens/Emergencia.jsx y Perfil.jsx → Panel del Guardián):
 * vecino reporta → Guardián confirma (CONFIRMACIONES_REQUERIDAS) o descarta → todos responden a la alerta →
 * piden o dan ayuda → un Guardián marca la emergencia como atendida.
 */
import type { Consulta } from '../db/index.ts';
import { err } from '../http.ts';
import { config } from '../config.ts';
import type { SesionActual } from '../auth/sesion.ts';
import * as repo from '../repositorios/emergencias.ts';
import * as v from '../validar.ts';

export const TIPOS = ['inundacion', 'incendio', 'sismo', 'servicios', 'accidente', 'otro'] as const;
const NECESIDADES = ['agua', 'comida', 'salud', 'rescate', 'refugio', 'otro'] as const;
const VULNERABLES = ['adulto', 'ninos', 'discapacidad', 'gestante', 'mascotas'] as const;
const RECURSOS = ['agua', 'refugio', 'salud', 'comida', 'energia', 'traslado'] as const;
/** El panel del Guardián permite descartar sin escribir motivo; la base exige uno. */
export const MOTIVO_POR_DEFECTO = 'Un Guardián revisó el reporte y no activó la emergencia.';

export const lector = (s: SesionActual): repo.ContextoLector => ({
	usuarioId: s.usuarioId,
	sectorId: s.sectorId,
	esGuardian: s.esGuardian,
	requeridas: config().confirmacionesRequeridas
});

async function emergenciaDelSector(db: Consulta, s: SesionActual, id: string) {
	const e = await repo.filaEmergencia(db, v.uuid(id, 'La emergencia'));
	if (!e || e.sector_id !== s.sectorId) throw err.noEncontrado('No encontramos esa emergencia en tu sector.');
	return e;
}

function soloGuardian(s: SesionActual) {
	if (!s.esGuardian) throw err.prohibido('Solo un Guardián del sector puede hacer esto.', 'SOLO_GUARDIAN');
}

const leer = async (db: Consulta, s: SesionActual, id: string) => (await repo.obtenerEmergencia(db, lector(s), id))!;

export async function reportar(db: Consulta, s: SesionActual, body: v.Cuerpo): Promise<{ emergencia: repo.EmergenciaDto; creada: boolean }> {
	const id = v.uuid(body.id, 'El id');
	const creada = await repo.crearEmergencia(db, {
		id,
		sectorId: s.sectorId,
		reporteroId: s.usuarioId,
		tipo: v.opcion(body.tipo, 'tipo', TIPOS),
		texto: v.texto(body.texto, 'El texto', { max: 200, opcional: true }),
		foto: v.foto(body.foto),
		manzana: s.manzana
	});
	const e = await repo.filaEmergencia(db, id);
	if (!e || e.reportero_id !== s.usuarioId) throw err.conflicto('Ese id ya está en uso.', 'ID_EN_USO');
	return { emergencia: await leer(db, s, id), creada };
}

export async function confirmar(db: Consulta, s: SesionActual, id: string): Promise<repo.EmergenciaDto> {
	soloGuardian(s);
	const e = await emergenciaDelSector(db, s, id);
	if (e.estado === 'activa') return leer(db, s, e.id);
	if (e.estado !== 'pendiente') throw err.conflicto('Este reporte ya fue revisado por otro Guardián.', 'YA_REVISADA');
	const n = await repo.registrarConfirmacion(db, e.id, s.usuarioId);
	if (n >= config().confirmacionesRequeridas) {
		await repo.activarEmergencia(db, e.id, s.usuarioId);
		// Quien confirma ya "vio" la alerta (igual que el frontend).
		await repo.guardarAcuse(db, e.id, s.usuarioId, { respuesta: 'visto' });
	}
	return leer(db, s, e.id);
}

export async function descartar(db: Consulta, s: SesionActual, id: string, body: v.Cuerpo): Promise<repo.EmergenciaDto> {
	soloGuardian(s);
	const e = await emergenciaDelSector(db, s, id);
	if (e.estado === 'descartada') return leer(db, s, e.id);
	if (e.estado !== 'pendiente') throw err.conflicto('Este reporte ya fue revisado por otro Guardián.', 'YA_REVISADA');
	const motivo = v.texto(body.motivo, 'El motivo', { max: 200, opcional: true }) || MOTIVO_POR_DEFECTO;
	if (motivo.length < 3) throw err.invalido('El motivo debe tener al menos 3 caracteres.');
	await repo.descartarEmergencia(db, e.id, s.usuarioId, motivo);
	return leer(db, s, e.id);
}

export async function atender(db: Consulta, s: SesionActual, id: string): Promise<repo.EmergenciaDto> {
	soloGuardian(s);
	const e = await emergenciaDelSector(db, s, id);
	if (e.estado === 'atendida') return leer(db, s, e.id);
	if (e.estado !== 'activa') throw err.conflicto('Solo se puede cerrar una emergencia activa.', 'NO_ACTIVA');
	await repo.atenderEmergencia(db, e.id, s.usuarioId);
	await repo.guardarAcuse(db, e.id, s.usuarioId, { fin_visto: true });
	return leer(db, s, e.id);
}

/** Mi respuesta a la alerta (visto / bien / ayuda), si ya vi el aviso de fin y, si la reporté, si vi la respuesta del Guardián. */
export async function acusar(db: Consulta, s: SesionActual, id: string, body: v.Cuerpo): Promise<void> {
	const e = await emergenciaDelSector(db, s, id);
	const respuesta = body.respuesta === undefined || body.respuesta === null ? null : v.opcion(body.respuesta, 'respuesta', ['visto', 'bien', 'ayuda'] as const);
	const finVisto = body.fin_visto === undefined ? undefined : v.booleano(body.fin_visto, 'fin_visto');
	if (body.reportero_visto !== undefined) {
		if (e.reportero_id !== s.usuarioId) throw err.prohibido('Solo quien reportó puede marcar esto.');
		if (v.booleano(body.reportero_visto, 'reportero_visto')) await repo.marcarReporteroVisto(db, e.id);
	}
	if (respuesta !== null || finVisto !== undefined) await repo.guardarAcuse(db, e.id, s.usuarioId, { respuesta, fin_visto: finVisto });
}

/* -------------------------------------------------------- pedidos */
export async function pedirAyuda(db: Consulta, s: SesionActual, emergenciaId: string, body: v.Cuerpo): Promise<{ pedido: repo.PedidoDto; creado: boolean }> {
	const e = await emergenciaDelSector(db, s, emergenciaId);
	const id = v.uuid(body.id, 'El id');
	const previo = await repo.filaPedido(db, id);
	if (previo) {
		if (previo.dueno_id !== s.usuarioId) throw err.conflicto('Ese id ya está en uso.', 'ID_EN_USO');
		return { pedido: (await repo.listarPedidos(db, s, { id }))[0], creado: false };
	}
	if (e.estado !== 'activa') throw err.conflicto('No hay una emergencia activa en tu sector.', 'SIN_EMERGENCIA_ACTIVA');
	const vulnerables = body.vulnerables === undefined ? [] : v.listaUnica(body.vulnerables, 'Quiénes están contigo', VULNERABLES, 0, 5);
	await repo.crearPedido(db, {
		id,
		emergenciaId: e.id,
		duenoId: s.usuarioId,
		necesidad: v.opcion(body.necesidad, 'necesidad', NECESIDADES),
		cuantas: body.cuantas === undefined ? 1 : v.entero(body.cuantas, 'Cuántas personas', 1, 99),
		texto: v.texto(body.texto, 'El texto', { max: 200, opcional: true }),
		foto: v.foto(body.foto),
		manzana: s.manzana,
		vulnerables
	});
	return { pedido: (await repo.listarPedidos(db, s, { id }))[0], creado: true };
}

export async function ayudar(db: Consulta, s: SesionActual, id: string): Promise<repo.PedidoDto> {
	const p = await repo.filaPedido(db, v.uuid(id, 'El pedido'));
	if (!p || p.sector_id !== s.sectorId) throw err.noEncontrado();
	if (p.dueno_id === s.usuarioId) throw err.invalido('Es tu propio pedido.', 'ES_TUYO');
	if (p.ayudante_id === s.usuarioId) return (await repo.listarPedidos(db, s, { id: p.id }))[0];
	if (p.estado_emergencia !== 'activa') throw err.conflicto('La emergencia ya terminó.', 'SIN_EMERGENCIA_ACTIVA');
	if (!(await repo.ayudarPedido(db, p.id, s.usuarioId))) throw err.conflicto('Otro vecino ya va en camino a ayudar.', 'YA_TIENE_AYUDA');
	return (await repo.listarPedidos(db, s, { id: p.id }))[0];
}

export async function resolverPedido(db: Consulta, s: SesionActual, id: string): Promise<repo.PedidoDto> {
	const p = await repo.filaPedido(db, v.uuid(id, 'El pedido'));
	if (!p || p.sector_id !== s.sectorId) throw err.noEncontrado();
	if (p.dueno_id !== s.usuarioId) throw err.prohibido('Solo quien pidió la ayuda puede marcarla como recibida.');
	await repo.resolverPedido(db, p.id);
	return (await repo.listarPedidos(db, s, { id: p.id }))[0];
}

export async function listarPedidos(db: Consulta, s: SesionActual, emergenciaId: string) {
	const e = await emergenciaDelSector(db, s, emergenciaId);
	return repo.listarPedidos(db, s, { emergenciaId: e.id });
}

export const recursoValido = (r: unknown) => (r === undefined || r === null || r === '' ? null : v.opcion(r, 'recurso', RECURSOS));
