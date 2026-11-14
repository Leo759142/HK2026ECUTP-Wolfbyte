/** Casos de uso de servicios y productos, "¿Te atendió?" y Visto Bueno Vecinal. */
import type { Consulta } from '../db/index.ts';
import { err } from '../http.ts';
import type { SesionActual } from '../auth/sesion.ts';
import * as repo from '../repositorios/servicios.ts';
import * as usuarios from '../repositorios/usuarios.ts';
import { whatsappUrl } from '../dto.ts';
import * as v from '../validar.ts';

export const CATEGORIAS = ['gasfiteria', 'electricidad', 'carpinteria', 'cerrajeria', 'mascotas', 'clases', 'costura', 'comida', 'otros'] as const;
export const ETIQUETAS = ['puntual', 'precio', 'limpio', 'amable', 'rapido', 'volveria'] as const;
const CLASES = ['servicio', 'producto'] as const;

function datos(body: v.Cuerpo): repo.DatosServicio {
	return {
		clase: v.opcion(body.clase ?? 'servicio', 'clase', CLASES),
		categoria: v.opcion(body.categoria, 'categoria', CATEGORIAS),
		titulo: v.texto(body.titulo, 'El nombre corto', { min: 3, max: 40 }),
		descripcion: v.texto(body.descripcion, 'La descripción', { min: 10, max: 200 }),
		horario: v.texto(body.horario, 'El horario', { min: 1, max: 80 }),
		precio: v.textoONull(body.precio, 'El precio', { max: 40 }),
		foto: v.foto(body.foto),
		mostrar_nombre_completo: body.mostrar_nombre_completo === undefined ? false : v.booleano(body.mostrar_nombre_completo, 'mostrar_nombre_completo')
	};
}

/** Servicio visible para mí (de mi sector y no eliminado; los ocultos solo para su dueño). */
async function visible(db: Consulta, s: SesionActual, id: string): Promise<repo.ServicioDto> {
	const sv = await repo.obtenerServicio(db, v.uuid(id, 'El servicio'), s.manzana);
	const fila = sv && (await repo.filaServicio(db, sv.id));
	const mio = sv?.dueno_id === s.usuarioId;
	if (!sv || !fila || fila.sector_id !== s.sectorId || sv.eliminado_en || (!mio && (sv.moderacion !== 'visible' || sv.estado !== 'disponible'))) {
		throw err.noEncontrado('Esta publicación ya no está disponible.');
	}
	return sv;
}

export const detalle = visible;

export async function crear(db: Consulta, s: SesionActual, body: v.Cuerpo): Promise<{ servicio: repo.ServicioDto; creado: boolean }> {
	const id = v.uuid(body.id, 'El id');
	const d = datos(body);
	const creado = await repo.crearServicio(db, id, s.usuarioId, d);
	const fila = await repo.filaServicio(db, id);
	if (!creado && fila?.dueno_id !== s.usuarioId) throw err.conflicto('Ese id ya está en uso.', 'ID_EN_USO');
	return { servicio: (await repo.obtenerServicio(db, id, s.manzana))!, creado };
}

/** Editar, pausar o reactivar mi servicio. Conflictos: la última escritura gana (por actualizado_en del dispositivo). */
export async function editar(db: Consulta, s: SesionActual, id: string, body: v.Cuerpo): Promise<repo.ServicioDto> {
	const fila = await repo.filaServicio(db, v.uuid(id, 'El servicio'));
	if (!fila || fila.eliminado_en) throw err.noEncontrado();
	if (fila.dueno_id !== s.usuarioId) throw err.prohibido('Solo quien publicó puede editar esta publicación.');
	const cuando = v.fechaIso(body.actualizado_en, 'actualizado_en');
	if (cuando && cuando.getTime() < new Date(fila.actualizado_en).getTime()) {
		throw err.conflicto('Ya había un cambio más reciente de esta publicación.', 'DESACTUALIZADO');
	}
	const c: Record<string, unknown> = {};
	if ('clase' in body) c.clase = v.opcion(body.clase, 'clase', CLASES);
	if ('categoria' in body) c.categoria = v.opcion(body.categoria, 'categoria', CATEGORIAS);
	if ('titulo' in body) c.titulo = v.texto(body.titulo, 'El nombre corto', { min: 3, max: 40 });
	if ('descripcion' in body) c.descripcion = v.texto(body.descripcion, 'La descripción', { min: 10, max: 200 });
	if ('horario' in body) c.horario = v.texto(body.horario, 'El horario', { min: 1, max: 80 });
	if ('precio' in body) c.precio = v.textoONull(body.precio, 'El precio', { max: 40 });
	if ('foto' in body) c.foto = v.foto(body.foto);
	if ('mostrar_nombre_completo' in body) c.mostrar_nombre_completo = v.booleano(body.mostrar_nombre_completo, 'mostrar_nombre_completo');
	if ('estado' in body) c.estado = v.opcion(body.estado, 'estado', ['disponible', 'pausado'] as const);
	await repo.actualizarServicio(db, fila.id, c);
	return (await repo.obtenerServicio(db, fila.id, s.manzana))!;
}

export async function eliminar(db: Consulta, s: SesionActual, id: string): Promise<void> {
	const fila = await repo.filaServicio(db, v.uuid(id, 'El servicio'));
	if (!fila || fila.eliminado_en) return; // ya no existe: borrar es idempotente
	if (fila.dueno_id !== s.usuarioId) throw err.prohibido('Solo quien publicó puede eliminar esta publicación.');
	await repo.eliminarServicio(db, fila.id);
}

/** "Escribir por WhatsApp": anota el contacto y devuelve el enlace (el número nunca se lista). */
export async function contactar(db: Consulta, s: SesionActual, servicioId: string, contactoId?: unknown): Promise<repo.ContactoDto> {
	const sv = await visible(db, s, servicioId);
	if (sv.dueno_id === s.usuarioId) throw err.invalido('Es tu propia publicación.', 'ES_TUYO');
	let c = await repo.contactoAbierto(db, sv.id, s.usuarioId);
	if (!c) c = await repo.crearContacto(db, contactoId ? v.uuid(contactoId, 'El id') : crypto.randomUUID(), sv.id, s.usuarioId);
	const tel = await usuarios.telefonoDe(db, sv.dueno_id);
	const nombre = sv.dueno?.nombre ?? '';
	return { ...c, whatsapp_url: tel ? whatsappUrl(tel, `Hola ${nombre}, te vi en AYNI. Me interesa: ${sv.titulo}.`) : null };
}

export async function responderContacto(db: Consulta, s: SesionActual, id: string, body: v.Cuerpo): Promise<repo.ContactoDto> {
	const c = await repo.obtenerContacto(db, v.uuid(id, 'El contacto'));
	if (!c) throw err.noEncontrado();
	if (c.usuario_id !== s.usuarioId) throw err.prohibido();
	const atendido = v.booleano(body.atendido, 'atendido');
	if (c.respondido) return c.atendido === atendido ? c : repo.responderContacto(db, c.id, atendido);
	return repo.responderContacto(db, c.id, atendido);
}

/** Visto Bueno: 1 a 6 etiquetas, solo si te atendieron, una vez por servicio y nunca el propio (lo valida también el trigger). */
export async function recomendar(db: Consulta, s: SesionActual, servicioId: string, body: v.Cuerpo): Promise<{ reco: repo.RecomendacionDto; creada: boolean }> {
	const id = v.uuid(body.id, 'El id');
	const previa = await repo.obtenerRecomendacion(db, id);
	if (previa) {
		if (previa.usuario_id !== s.usuarioId) throw err.conflicto('Ese id ya está en uso.', 'ID_EN_USO');
		return { reco: previa, creada: false };
	}
	const sv = await visible(db, s, servicioId);
	if (sv.dueno_id === s.usuarioId) throw err.prohibido('No puedes recomendar tu propio servicio.', 'NO_PUEDE_RECOMENDAR');
	const etiquetas = v.listaUnica(body.etiquetas, 'Las etiquetas', ETIQUETAS, 1, 6);
	const comentario = v.texto(body.comentario, 'El comentario', { max: 200, opcional: true });
	const ya = (await repo.recomendacionesDeServicio(db, sv.id)).some((r) => r.usuario_id === s.usuarioId);
	if (ya) throw err.conflicto('Ya le diste tu Visto Bueno 💜', 'YA_RECOMENDADO');
	await repo.crearRecomendacion(db, { id, servicioId: sv.id, usuarioId: s.usuarioId, etiquetas, comentario });
	return { reco: (await repo.obtenerRecomendacion(db, id))!, creada: true };
}
