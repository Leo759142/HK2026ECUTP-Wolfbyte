/**
 * Casos de uso de la Cadena de Favores (reglas de frontend/src/screens/Favores.jsx y data.js):
 * - Reservar ("Lo quiero / Puedo ayudar") dura 1 hora; gana el primero.
 * - "Listo" lo pulsan ambas partes; con las dos confirmaciones el favor queda cerrado y suma al Balance de Ayni.
 * - Con 3 reportes pendientes la publicación se oculta sola (trigger) hasta que un Guardián decida.
 */
import type { Consulta } from '../db/index.ts';
import { err } from '../http.ts';
import type { SesionActual } from '../auth/sesion.ts';
import * as repo from '../repositorios/favores.ts';
import * as servicios from '../repositorios/servicios.ts';
import * as usuarios from '../repositorios/usuarios.ts';
import { whatsappUrl } from '../dto.ts';
import * as v from '../validar.ts';

export const TIPOS = ['pido', 'presto', 'regalo', 'intercambio'] as const;

async function delSector(db: Consulta, s: SesionActual, id: string) {
	const f = await repo.obtenerFavor(db, v.uuid(id, 'El favor'));
	if (!f || f.sector_id !== s.sectorId || f.eliminado_en) throw err.noEncontrado('Esta publicación ya no está disponible.');
	return f;
}

/** Enlace de WhatsApp entre las dos partes de una reserva (solo ellos lo reciben). */
async function conEnlace(db: Consulta, s: SesionActual, f: repo.FavorDto): Promise<repo.FavorDto> {
	const soyDueno = f.dueno_id === s.usuarioId;
	const soyTomador = f.tomador_id === s.usuarioId;
	if (f.estado !== 'reservado' || (!soyDueno && !soyTomador)) return f;
	const otroId = soyDueno ? f.tomador_id! : f.dueno_id;
	const otro = soyDueno ? f.tomador : f.dueno;
	const tel = await usuarios.telefonoDe(db, otroId);
	return { ...f, whatsapp_url: tel ? whatsappUrl(tel, `Hola ${otro?.nombre ?? ''}, te escribo desde AYNI por: ${f.titulo}.`) : null };
}

export async function detalle(db: Consulta, s: SesionActual, id: string): Promise<repo.FavorDto> {
	await repo.liberarReservasVencidas(db);
	const f = await delSector(db, s, id);
	if (f.moderacion !== 'visible' && f.dueno_id !== s.usuarioId) throw err.noEncontrado('Esta publicación ya no está disponible.');
	return conEnlace(db, s, f);
}

function datos(body: v.Cuerpo) {
	const tipo = v.opcion(body.tipo, 'tipo', TIPOS);
	return {
		tipo,
		titulo: v.texto(body.titulo, 'El título', { min: 3, max: 200 }),
		detalles: v.detalles(body.detalles),
		foto: v.foto(body.foto)
	};
}

export async function crear(db: Consulta, s: SesionActual, body: v.Cuerpo): Promise<{ favor: repo.FavorDto; creado: boolean }> {
	const id = v.uuid(body.id, 'El id');
	const d = datos(body);
	const creado = await repo.crearFavor(db, { id, duenoId: s.usuarioId, ...d });
	const f = await repo.obtenerFavor(db, id);
	if (!f || f.dueno_id !== s.usuarioId) throw err.conflicto('Ese id ya está en uso.', 'ID_EN_USO');
	return { favor: f, creado };
}

/** Editar mi favor mientras está disponible (la última escritura gana). */
export async function editar(db: Consulta, s: SesionActual, id: string, body: v.Cuerpo): Promise<repo.FavorDto> {
	const f = await delSector(db, s, id);
	if (f.dueno_id !== s.usuarioId) throw err.prohibido('Solo quien publicó puede editarlo.');
	if (f.estado !== 'disponible') throw err.conflicto('Solo puedes editar un favor que está disponible.', 'NO_EDITABLE');
	const cuando = v.fechaIso(body.actualizado_en, 'actualizado_en');
	if (cuando && cuando.getTime() < new Date(f.actualizado_en).getTime()) {
		throw err.conflicto('Ya había un cambio más reciente de esta publicación.', 'DESACTUALIZADO');
	}
	const c: { titulo?: string; detalles?: Record<string, string>; foto?: string | null } = {};
	if ('titulo' in body) c.titulo = v.texto(body.titulo, 'El título', { min: 3, max: 200 });
	if ('detalles' in body) c.detalles = v.detalles(body.detalles);
	if ('foto' in body) c.foto = v.foto(body.foto);
	await repo.actualizarFavor(db, f.id, c);
	return (await repo.obtenerFavor(db, f.id))!;
}

export async function eliminar(db: Consulta, s: SesionActual, id: string): Promise<void> {
	const f = await repo.obtenerFavor(db, v.uuid(id, 'El favor'));
	if (!f || f.eliminado_en) return;
	if (f.dueno_id !== s.usuarioId) throw err.prohibido('Solo quien publicó puede eliminarlo.');
	if (f.estado === 'reservado') throw err.conflicto('Tiene una reserva activa: libérala antes de eliminarlo.', 'RESERVADO');
	if (f.estado === 'cerrado') throw err.conflicto('Un favor cerrado forma parte del Balance de Ayni y no se elimina.', 'CERRADO');
	await repo.eliminarFavor(db, f.id);
}

export async function reservar(db: Consulta, s: SesionActual, id: string): Promise<repo.FavorDto> {
	await repo.liberarReservasVencidas(db);
	const f = await delSector(db, s, id);
	if (f.dueno_id === s.usuarioId) throw err.invalido('Es tu propia publicación.', 'ES_TUYO');
	if (f.estado === 'reservado' && f.tomador_id === s.usuarioId) return conEnlace(db, s, f); // reintento
	if (!(await repo.reservarFavor(db, f.id, s.usuarioId))) {
		throw err.conflicto('Otro vecino lo reservó primero. Si no se concreta en 1 hora, vuelve a estar disponible.', 'RESERVA_OCUPADA');
	}
	return conEnlace(db, s, (await repo.obtenerFavor(db, f.id))!);
}

export async function liberar(db: Consulta, s: SesionActual, id: string): Promise<repo.FavorDto> {
	await repo.liberarReservasVencidas(db);
	const f = await delSector(db, s, id);
	if (f.dueno_id !== s.usuarioId && f.tomador_id !== s.usuarioId) throw err.prohibido('Solo el dueño o quien reservó puede soltar la reserva.');
	if (f.estado === 'disponible') return f;
	if (f.estado !== 'reservado' || !(await repo.liberarFavor(db, f.id))) throw err.conflicto('Este favor ya no está reservado.', 'NO_RESERVADO');
	return (await repo.obtenerFavor(db, f.id))!;
}

export async function listo(db: Consulta, s: SesionActual, id: string): Promise<repo.FavorDto> {
	await repo.liberarReservasVencidas(db);
	const f = await delSector(db, s, id);
	const lado = f.dueno_id === s.usuarioId ? 'dueno' : f.tomador_id === s.usuarioId ? 'tomador' : null;
	if (!lado) throw err.prohibido('Solo las dos personas del favor pueden confirmarlo.');
	if (f.estado === 'cerrado') return f;
	if (f.estado !== 'reservado') throw err.conflicto('La reserva venció o se liberó. Vuelve a reservarlo.', 'NO_RESERVADO');
	await repo.confirmarLado(db, f.id, lado);
	return conEnlace(db, s, (await repo.obtenerFavor(db, f.id))!);
}

/* -------------------------------------------------------- moderación */
export async function reportar(db: Consulta, s: SesionActual, body: v.Cuerpo): Promise<{ creado: boolean }> {
	const id = v.uuid(body.id, 'El id');
	const tipo = v.opcion(body.objeto_tipo, 'objeto_tipo', ['servicio', 'favor'] as const);
	const objetoId = v.uuid(body.objeto_id, 'La publicación');
	const motivo = v.opcion(body.motivo, 'motivo', repo.MOTIVOS);
	let dueno: string | null = null;
	let sector: string | null = null;
	if (tipo === 'servicio') {
		const fila = await servicios.filaServicio(db, objetoId);
		dueno = fila?.dueno_id ?? null;
		sector = fila && !fila.eliminado_en ? fila.sector_id : null;
	} else {
		const f = await repo.obtenerFavor(db, objetoId);
		dueno = f?.dueno_id ?? null;
		sector = f && !f.eliminado_en ? f.sector_id : null;
	}
	if (!sector || sector !== s.sectorId) throw err.noEncontrado('Esa publicación ya no está disponible.');
	if (dueno === s.usuarioId) throw err.invalido('No puedes reportar tu propia publicación.', 'ES_TUYO');
	const ya = (await repo.misReportes(db, s.usuarioId)).find((r) => r.objeto_id === objetoId);
	if (ya) {
		if (ya.id === id) return { creado: false };
		throw err.conflicto('Ya enviaste un reporte de esta publicación. Un Guardián lo está revisando.', 'YA_REPORTADO');
	}
	return { creado: await repo.crearReporte(db, { id, tipo, objetoId, usuarioId: s.usuarioId, motivo }) };
}

function soloGuardian(s: SesionActual) {
	if (!s.esGuardian) throw err.prohibido('Solo los Guardianes del sector pueden hacer esto.', 'SOLO_GUARDIAN');
}

export async function pendientes(db: Consulta, s: SesionActual) {
	soloGuardian(s);
	return repo.pendientesModeracion(db, s.sectorId);
}

export async function resolver(db: Consulta, s: SesionActual, body: v.Cuerpo): Promise<void> {
	soloGuardian(s);
	const tipo = v.opcion(body.objeto_tipo, 'objeto_tipo', ['servicio', 'favor'] as const);
	const objetoId = v.uuid(body.objeto_id, 'La publicación');
	const decision = v.opcion(body.decision, 'decision', ['aprobar', 'ocultar'] as const);
	const sector =
		tipo === 'servicio' ? (await servicios.filaServicio(db, objetoId))?.sector_id : (await repo.obtenerFavor(db, objetoId))?.sector_id;
	if (!sector) throw err.noEncontrado();
	if (sector !== s.sectorId) throw err.prohibido('Esa publicación es de otro sector.', 'SOLO_GUARDIAN');
	await repo.resolverModeracion(db, tipo, objetoId, s.usuarioId, decision);
}
