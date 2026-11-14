/**
 * Sincronización offline (POST /sync/push y GET /sync/pull).
 *
 * push: cada operación trae un op_id (UUID generado en el celular) y se aplica UNA sola vez:
 *  - Nueva → se ejecuta el mismo caso de uso que el endpoint REST, en su propia transacción.
 *  - op_id ya aplicado → "duplicada" (no se repite).
 *  - op_id ya rechazado → se devuelve el mismo rechazo (para que el cliente no lo dé por enviado).
 *  Una operación rechazada no bloquea a las demás.
 *  Conflictos: edición de servicios/favores → la última escritura gana (DESACTUALIZADO si llega una más vieja);
 *  reservar un favor o "voy yo" → gana el primero; recomendaciones y reportes → solo se agregan;
 *  emergencias → manda el servidor (el Guardián decide).
 *
 * pull: lo que cambió en mi sector desde `desde` (o todo si no se envía).
 */
import type { Db } from '../db/index.ts';
import { aErrorApi, err } from '../http.ts';
import { iso } from '../dto.ts';
import { leerSesion, type SesionActual } from '../auth/sesion.ts';
import * as v from '../validar.ts';
import * as cuentas from './cuentas.ts';
import * as srv from './servicios.ts';
import * as fav from './favores.ts';
import * as emer from './emergencias.ts';
import * as repoServicios from '../repositorios/servicios.ts';
import * as repoFavores from '../repositorios/favores.ts';
import * as repoEmergencias from '../repositorios/emergencias.ts';
import * as repoUsuarios from '../repositorios/usuarios.ts';
import * as repoSectores from '../repositorios/sectores.ts';
import type { Consulta } from '../db/index.ts';

export const ENTIDADES = [
	'servicios', 'favores', 'contactos', 'recomendaciones', 'reportes', 'emergencias',
	'pedidos_ayuda', 'emergencia_acuses', 'usuarios', 'moderacion'
] as const;
const OPERACIONES = ['crear', 'actualizar', 'eliminar'] as const;
type Entidad = (typeof ENTIDADES)[number];
type Operacion = (typeof OPERACIONES)[number];
type Manejador = (tx: Consulta, s: SesionActual, p: v.Cuerpo) => Promise<unknown>;

const accion = (p: v.Cuerpo, opciones: readonly string[]) => v.opcion(p.accion, 'accion', opciones);

/** Mismas reglas que los endpoints REST: cada entidad/operación llama al mismo caso de uso. */
const MANEJADORES: Record<Entidad, Partial<Record<Operacion, Manejador>>> = {
	servicios: {
		crear: (tx, s, p) => srv.crear(tx, s, p),
		actualizar: (tx, s, p) => srv.editar(tx, s, String(p.id), p),
		eliminar: (tx, s, p) => srv.eliminar(tx, s, String(p.id))
	},
	favores: {
		crear: (tx, s, p) => fav.crear(tx, s, p),
		actualizar: (tx, s, p) => {
			if (p.accion === undefined) return fav.editar(tx, s, String(p.id), p);
			const a = accion(p, ['reservar', 'liberar', 'listo']);
			return a === 'reservar' ? fav.reservar(tx, s, String(p.id)) : a === 'liberar' ? fav.liberar(tx, s, String(p.id)) : fav.listo(tx, s, String(p.id));
		},
		eliminar: (tx, s, p) => fav.eliminar(tx, s, String(p.id))
	},
	contactos: {
		crear: (tx, s, p) => srv.contactar(tx, s, String(p.servicio_id), p.id),
		actualizar: (tx, s, p) => srv.responderContacto(tx, s, String(p.id), p)
	},
	recomendaciones: { crear: (tx, s, p) => srv.recomendar(tx, s, String(p.servicio_id), p) },
	reportes: { crear: (tx, s, p) => fav.reportar(tx, s, p) },
	emergencias: {
		crear: (tx, s, p) => emer.reportar(tx, s, p),
		actualizar: (tx, s, p) => {
			const a = accion(p, ['confirmar', 'descartar', 'atender']);
			return a === 'confirmar' ? emer.confirmar(tx, s, String(p.id)) : a === 'descartar' ? emer.descartar(tx, s, String(p.id), p) : emer.atender(tx, s, String(p.id));
		}
	},
	pedidos_ayuda: {
		crear: (tx, s, p) => emer.pedirAyuda(tx, s, String(p.emergencia_id), p),
		actualizar: (tx, s, p) => (accion(p, ['ayudar', 'resolver']) === 'ayudar' ? emer.ayudar(tx, s, String(p.id)) : emer.resolverPedido(tx, s, String(p.id)))
	},
	emergencia_acuses: {
		crear: (tx, s, p) => emer.acusar(tx, s, String(p.emergencia_id), p),
		actualizar: (tx, s, p) => emer.acusar(tx, s, String(p.emergencia_id), p)
	},
	usuarios: {
		actualizar: (tx, s, p) => (p.accion === 'invitacion' ? cuentas.responderInvitacion(tx, s, p) : cuentas.actualizarPerfil(tx, s, p))
	},
	moderacion: { crear: (tx, s, p) => fav.resolver(tx, s, p) }
};

export interface ResultadoSync {
	op_id: string;
	resultado: 'aplicada' | 'duplicada' | 'rechazada';
	codigo?: string | null;
	motivo?: string | null;
}

export async function push(db: Db, sesion: SesionActual, token: string, body: v.Cuerpo): Promise<{ resultados: ResultadoSync[] }> {
	if (!Array.isArray(body.operaciones)) throw err.invalido('Envía { operaciones: [...] }.');
	if (body.operaciones.length > 100) throw err.invalido('Máximo 100 operaciones por envío.');
	let s = sesion;
	const resultados: ResultadoSync[] = [];
	for (const bruta of body.operaciones as unknown[]) {
		const op = (bruta && typeof bruta === 'object' ? bruta : {}) as v.Cuerpo;
		const opId = v.esUuid(op.op_id) ? String(op.op_id).toLowerCase() : null;
		if (!opId) {
			resultados.push({ op_id: String(op.op_id ?? ''), resultado: 'rechazada', codigo: 'OP_ID_INVALIDO', motivo: 'op_id debe ser un UUID.' });
			continue;
		}
		const [previa] = await db.query<{ usuario_id: string; resultado: string; codigo: string | null; motivo: string | null }>(
			'SELECT usuario_id, resultado, codigo, motivo FROM sync_operaciones WHERE op_id = $1',
			[opId]
		);
		if (previa) {
			if (previa.usuario_id !== s.usuarioId) {
				resultados.push({ op_id: opId, resultado: 'rechazada', codigo: 'OP_ID_EN_USO', motivo: 'Ese op_id pertenece a otra cuenta.' });
			} else if (previa.resultado === 'aplicada') {
				resultados.push({ op_id: opId, resultado: 'duplicada' });
			} else {
				resultados.push({ op_id: opId, resultado: 'rechazada', codigo: previa.codigo, motivo: previa.motivo });
			}
			continue;
		}
		const entidad = (ENTIDADES as readonly string[]).includes(String(op.entidad)) ? (op.entidad as Entidad) : null;
		const operacion = (OPERACIONES as readonly string[]).includes(String(op.operacion)) ? (op.operacion as Operacion) : null;
		const creadoLocal = (() => {
			const d = new Date(String(op.creado_en ?? ''));
			return Number.isNaN(d.getTime()) ? new Date() : d;
		})();
		const payload = op.payload && typeof op.payload === 'object' && !Array.isArray(op.payload) ? (op.payload as v.Cuerpo) : null;
		const manejador = entidad && operacion ? MANEJADORES[entidad][operacion] : undefined;
		try {
			if (!entidad || !operacion || !manejador) throw err.invalido(`Operación no soportada: ${String(op.entidad)}/${String(op.operacion)}.`, 'OPERACION_NO_SOPORTADA');
			if (!payload) throw err.invalido('La operación no trae datos (payload).');
			await db.transaccion(async (tx) => {
				await manejador(tx, s, payload);
				await tx.query(
					`INSERT INTO sync_operaciones (op_id, usuario_id, entidad, operacion, resultado, creado_local) VALUES ($1, $2, $3, $4, 'aplicada', $5)`,
					[opId, s.usuarioId, entidad, operacion, creadoLocal]
				);
			});
			resultados.push({ op_id: opId, resultado: 'aplicada' });
			if (entidad === 'usuarios') s = (await leerSesion(db, token)).sesion ?? s; // pudo cambiar Guardián o manzana
		} catch (e) {
			const ea = aErrorApi(e);
			if (ea.status >= 500) {
				// Error del servidor: no se registra, para que el cliente reintente con el mismo op_id.
				resultados.push({ op_id: opId, resultado: 'rechazada', codigo: 'REINTENTAR', motivo: ea.message });
				continue;
			}
			if (entidad && operacion) {
				await db
					.query(
						`INSERT INTO sync_operaciones (op_id, usuario_id, entidad, operacion, resultado, codigo, motivo, creado_local)
						 VALUES ($1, $2, $3, $4, 'rechazada', $5, $6, $7) ON CONFLICT (op_id) DO NOTHING`,
						[opId, s.usuarioId, entidad, operacion, ea.codigo, ea.message, creadoLocal]
					)
					.catch(() => undefined);
			}
			resultados.push({ op_id: opId, resultado: 'rechazada', codigo: ea.codigo, motivo: ea.message });
		}
	}
	return { resultados };
}

/** Publicaciones que un vecino no debe ver (ocultas por moderación o eliminadas): solo se envía su id para quitarlas. */
function separarOcultos<T extends { id: string; dueno_id: string; moderacion: string; eliminado_en: string | null }>(lista: T[], s: SesionActual) {
	const visibles: T[] = [];
	const eliminados: string[] = [];
	for (const x of lista) {
		const mio = x.dueno_id === s.usuarioId;
		const borrado = Boolean(x.eliminado_en);
		const oculto = x.moderacion === 'oculto' || (x.moderacion === 'en_revision' && !s.esGuardian);
		if (borrado || (oculto && !mio)) eliminados.push(x.id);
		else visibles.push(x);
	}
	return { visibles, eliminados };
}

export async function pull(db: Db, s: SesionActual, desdeTexto: string | null) {
	const desde = desdeTexto ? v.fechaIso(desdeTexto, 'desde') : null;
	const [{ ahora }] = await db.query<{ ahora: Date }>('SELECT now() AS ahora');
	// Margen de 2 s para no perder filas confirmadas mientras se armaba la respuesta anterior.
	const d = desde ? new Date(desde.getTime() - 2000) : null;
	await repoFavores.liberarReservasVencidas(db);

	const servicios = separarOcultos(await repoServicios.listarServicios(db, { sectorId: s.sectorId, yo: s.usuarioId, miManzana: s.manzana, todos: true, desde: d }), s);
	const favores = separarOcultos(await repoFavores.listarFavores(db, { sectorId: s.sectorId, yo: s.usuarioId, todos: true, desde: d }), s);
	const lector = emer.lector(s);
	return {
		hasta: iso(ahora),
		completo: !desde,
		cambios: {
			yo: await repoUsuarios.obtenerUsuario(db, s.usuarioId),
			sectores: await repoSectores.sectoresCambiados(db, s.sectorId, d),
			usuarios: await repoUsuarios.vecinosDelSector(db, s.sectorId, d),
			servicios: servicios.visibles,
			recomendaciones: await repoServicios.recomendacionesDelSector(db, s.sectorId, d),
			contactos: await repoServicios.misContactos(db, s.usuarioId, { desde: d }),
			favores: favores.visibles,
			reportes: await repoFavores.misReportes(db, s.usuarioId),
			moderacion: s.esGuardian ? await repoFavores.pendientesModeracion(db, s.sectorId) : [],
			emergencias: await repoEmergencias.listarEmergencias(db, lector, { desde: d }),
			pedidos_ayuda: await repoEmergencias.listarPedidos(db, s, { desde: d }),
			grupos_apoyo: await repoEmergencias.listarGrupos(db, s.sectorId, { desde: d })
		},
		eliminados: { servicios: servicios.eliminados, favores: favores.eliminados }
	};
}
