import { baseDao } from '../dao/base.dao';
import { syncestadoDao } from '../dao/sync-estado.dao';

// Repository por dominio/agregado: sync_estado — RF/CU/tabla. Orquesta DAO + dominio + outbox.
export class SyncEstadoRepository {
	private entidad = 'sync_estado';
	private dao = syncestadoDao;
	async listar(): Promise<any[]> {
		return this.dao.listar();
	}
	async obtener(id: string): Promise<any> {
		return this.dao.obtenerPorId(id);
	}
	async guardar(payload: any, opId = crypto.randomUUID()): Promise<any> {
		await baseDao.transaccion(async () => {
			await this.dao.guardar(payload as Record<string, unknown>);
			await baseDao.encolar({ op_id: opId, entidad: this.entidad, operacion: 'crear', payload });
		});
		return payload;
	}
	async eliminar(id: string): Promise<void> {
		await this.dao.eliminar(id);
	}
}
export const syncestadoRepository = new SyncEstadoRepository();
