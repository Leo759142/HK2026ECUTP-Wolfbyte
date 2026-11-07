import { baseDao } from './base.dao';

// DAO por tabla/agregado: emergencias (RF/CU trazado a schema_sqlite.sql)
export class EmergenciaDao {
  private entidad = 'emergencias';
  async obtenerPorId(id: string): Promise<any> { return baseDao.obtenerPorId(this.entidad, id); }
  async listar(): Promise<any[]> { return baseDao.listar(this.entidad); }
  async guardar(payload: Record<string, unknown>): Promise<void> { await baseDao.guardar(this.entidad, payload); }
  async eliminar(id: string): Promise<void> { await baseDao.eliminar(this.entidad, id); }
}
export const emergenciaDao = new EmergenciaDao();
