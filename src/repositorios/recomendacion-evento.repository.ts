import { baseDao } from '../dao/base.dao';
import { recomendacioneventoDao } from '../dao/recomendacion-evento.dao';

// Repository por dominio/agregado: recomendaciones_eventos — RF/CU/tabla. Orquesta DAO + dominio + outbox.
export class RecomendacionEventoRepository {
  private entidad = 'recomendaciones_eventos';
  private dao = recomendacioneventoDao;
  async listar(): Promise<any[]> { return this.dao.listar(); }
  async obtener(id: string): Promise<any> { return this.dao.obtenerPorId(id); }
  async guardar(payload: any, opId = crypto.randomUUID()): Promise<any> {
    await baseDao.transaccion(async () => {
      await this.dao.guardar(payload as Record<string, unknown>);
      await baseDao.encolar({ op_id: opId, entidad: this.entidad, operacion: 'crear', payload });
    });
    return payload;
  }
  async eliminar(id: string): Promise<void> { await this.dao.eliminar(id); }
}
export const recomendacioneventoRepository = new RecomendacionEventoRepository();
