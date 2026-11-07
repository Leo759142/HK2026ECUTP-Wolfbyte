import { dao } from '../datos/dao';
import type { RepositorioServicio } from '../dominio/repositorios';
import type { Servicio, UUID } from '../dominio/tipos/tipos';

/** RF05 publicar servicio, RF06 buscar por categoría/zona. Persistencia local + outbox (RF17/RF18). */
export class ServicioRepoLocal implements RepositorioServicio {
	private entidad = 'servicios' as const;
	async listar(filtro?: { zona_id?: string; categoria?: string }, opts?: { limite?: number; offset?: number }): Promise<Servicio[]> {
		const paginado = await dao.listarLocalPaginado<Servicio>(this.entidad, opts);
		return paginado.items.filter((s) => (!filtro?.zona_id || s.zona_id === filtro.zona_id) && (!filtro?.categoria || s.categoria === filtro.categoria));
	}
	async guardar(servicio: Servicio, opId = crypto.randomUUID()): Promise<Servicio> {
		await dao.transaccion(async () => {
			await dao.aplicarLocal(this.entidad, servicio as unknown as Record<string, unknown>);
			await dao.encolar({ op_id: opId, entidad: this.entidad, operacion: 'crear', payload: servicio });
		});
		return servicio;
	}
	async obtener(id: UUID): Promise<Servicio | null> {
		return dao.obtenerLocal<Servicio>(this.entidad, id);
	}
}
