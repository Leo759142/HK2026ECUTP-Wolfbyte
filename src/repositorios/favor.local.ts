import { dao } from '../datos/dao';
import type { RepositorioFavor, RepositorioFavorConfirmacion } from '../dominio/repositorios';
import type { Favor, FavorConfirmacion, UUID } from '../dominio/tipos/tipos';
import { ServicioCierreFavor } from '../dominio/favores/cierre';

/** RF09 publicar favor, RF10 ofrecerse (parcial). */
export class FavorRepoLocal implements RepositorioFavor {
	private entidad = 'favores' as const;
	async listar(filtro?: { zona_id?: string; estado?: string }, opts?: { limite?: number; offset?: number }): Promise<Favor[]> {
		const paginado = await dao.listarLocalPaginado<Favor>(this.entidad, opts);
		return paginado.items.filter((f) => (!filtro?.zona_id || f.zona_id === filtro.zona_id) && (!filtro?.estado || f.estado === filtro.estado));
	}
	async guardar(favor: Favor, opId = crypto.randomUUID()): Promise<Favor> {
		await dao.transaccion(async () => {
			await dao.aplicarLocal(this.entidad, favor as unknown as Record<string, unknown>);
			await dao.encolar({ op_id: opId, entidad: this.entidad, operacion: 'crear', payload: favor });
		});
		return favor;
	}
	async obtener(id: UUID): Promise<Favor | null> {
		return dao.obtenerLocal<Favor>(this.entidad, id);
	}
}

/** RF11 cierre mutuo "Se cumplió" (CU08/HU08): confirmaciones append-only; cierra al tener solicitante+ayudante. */
export class FavorConfirmacionRepoLocal implements RepositorioFavorConfirmacion {
	private entidad = 'favor_confirmaciones' as const;
	async confirmar(confirmacion: FavorConfirmacion, opId = crypto.randomUUID()): Promise<FavorConfirmacion> {
		const row = { ...confirmacion, id: opId };
		await dao.transaccion(async () => {
			await dao.aplicarLocal(this.entidad, row as unknown as Record<string, unknown>);
			await dao.encolar({ op_id: opId, entidad: `favores/${confirmacion.favor_id}/confirmaciones`, operacion: 'crear', payload: confirmacion });
			const favor = await dao.obtenerLocal<Favor>('favores', confirmacion.favor_id);
			if (favor?.ayudante_id && favor.creador_id) {
				const confs = await this.listarPorFavor(confirmacion.favor_id);
				if (ServicioCierreFavor.evaluarCierreMutuo(confirmacion.favor_id, favor.creador_id, favor.ayudante_id, confs)) {
					await dao.aplicarLocal('favores', { ...favor, estado: 'cerrado', cerrado_en: new Date().toISOString() } as unknown as Record<string, unknown>);
				}
			}
		});
		return row;
	}
	async listarPorFavor(favorId: UUID): Promise<FavorConfirmacion[]> {
		const rows = await dao.listarLocal<FavorConfirmacion>(this.entidad);
		return rows.filter((c) => c.favor_id === favorId);
	}
}
