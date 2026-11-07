import { dao } from '../datos/dao';
import type { RepositorioServicio } from '../dominio/repositorios';
import type { Servicio, UUID } from '../dominio/tipos/tipos';
import { Servicio as ServicioDominio } from '../dominio/proximidad/servicios';

/**
 * Repositorio tipado por agregado: usa la entidad de dominio `Servicio`
 * directamente en lugar de Record<string, unknown>.
 * Mantiene el contrato de RepositorioServicio y delega persistencia en el DAO.
 */
export class ServicioRepoTipado implements RepositorioServicio {
	private entidad = 'servicios' as const;

	async listar(filtro?: { zona_id?: string; categoria?: string }, opts?: { limite?: number; offset?: number }): Promise<Servicio[]> {
		const paginado = await dao.listarLocalPaginado<Servicio>(this.entidad, opts);
		return paginado.items
			.filter((s) => (!filtro?.zona_id || s.zona_id === filtro.zona_id) && (!filtro?.categoria || s.categoria === filtro.categoria))
			.map((s) => new ServicioDominio(s as unknown as ConstructorParameters<typeof ServicioDominio>[0]));
	}

	async guardar(servicio: Servicio, opId = crypto.randomUUID()): Promise<Servicio> {
		const entidadValidada = new ServicioDominio(servicio as unknown as ConstructorParameters<typeof ServicioDominio>[0]);
		await dao.transaccion(async () => {
			await dao.aplicarLocal(this.entidad, entidadValidada as unknown as Record<string, unknown>);
			await dao.encolar({ op_id: opId, entidad: this.entidad, operacion: 'crear', payload: entidadValidada });
		});
		return entidadValidada;
	}

	async obtener(id: UUID): Promise<Servicio | null> {
		const fila = await dao.obtenerLocal<Servicio>(this.entidad, id);
		if (!fila) return null;
		return new ServicioDominio(fila as unknown as ConstructorParameters<typeof ServicioDominio>[0]);
	}
}