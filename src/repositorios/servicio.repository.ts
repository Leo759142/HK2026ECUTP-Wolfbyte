import { baseDao } from '../dao/base.dao';
import { servicioDao } from '../dao/servicio.dao';

// Repository por dominio/agregado: servicios — RF/CU/tabla. Orquesta DAO + dominio + outbox.
export class ServicioRepository {
  private entidad = 'servicios';
  private dao = servicioDao;
  async listar(): Promise<any[]> { return this.dao.listar(); }
  async obtener(id: string): Promise<any> { return this.dao.obtenerPorId(id); }
  async guardar(payload: any, opId = crypto.randomUUID()): Promise<any> {
    await baseDao.transaccion(async () => {
      await this.dao.guardar(payload as Record<string, unknown>);
      await baseDao.encolar({ op_id: opId, entidad: this.entidad, operacion: 'crear', payload });
    });
    return payload;
  }
  async seedDemo(): Promise<void> {
    const existentes = await this.dao.listar();
    if (existentes.length > 0) return;
    const seeds = [
      { id: 's1', zona_id: 'z1', categoria: 'gasfiteria', titulo: 'Gasfitero 24h', descripcion: 'Reparación de fugas y desagües.', lat_aprox: -12.05, lng_aprox: -77.04, usuario_id: 'u2', es_emprendimiento: 1, activo: 1, oculto: 0, creado_en: new Date().toISOString(), actualizado_en: new Date().toISOString() },
      { id: 's2', zona_id: 'z1', categoria: 'costura', titulo: 'Costurera del barrio', descripcion: 'Arreglos y confección.', lat_aprox: -12.051, lng_aprox: -77.041, usuario_id: 'u3', es_emprendimiento: 1, activo: 1, oculto: 0, creado_en: new Date().toISOString(), actualizado_en: new Date().toISOString() },
      { id: 's3', zona_id: 'z2', categoria: 'electricidad', titulo: 'Electricista certificado', descripcion: 'Instalaciones y reparaciones.', lat_aprox: -12.06, lng_aprox: -77.05, usuario_id: 'u4', es_emprendimiento: 1, activo: 1, oculto: 0, creado_en: new Date().toISOString(), actualizado_en: new Date().toISOString() },
      { id: 's4', zona_id: 'z2', categoria: 'carpinteria', titulo: 'Carpintero a domicilio', descripcion: 'Muebles y reparaciones.', lat_aprox: -12.061, lng_aprox: -77.051, usuario_id: 'u5', es_emprendimiento: 1, activo: 1, oculto: 0, creado_en: new Date().toISOString(), actualizado_en: new Date().toISOString() },
      { id: 's5', zona_id: 'z3', categoria: 'pintura', titulo: 'Pintor de interiores', descripcion: 'Pintura de casas.', lat_aprox: -12.07, lng_aprox: -77.06, usuario_id: 'u6', es_emprendimiento: 1, activo: 1, oculto: 0, creado_en: new Date().toISOString(), actualizado_en: new Date().toISOString() },
      { id: 's6', zona_id: 'z3', categoria: 'jardineria', titulo: 'Jardinería y poda', descripcion: 'Mantenimiento de jardines.', lat_aprox: -12.071, lng_aprox: -77.061, usuario_id: 'u7', es_emprendimiento: 1, activo: 1, oculto: 0, creado_en: new Date().toISOString(), actualizado_en: new Date().toISOString() },
      { id: 's7', zona_id: 'z4', categoria: 'limpieza', titulo: 'Limpieza profunda', descripcion: 'Servicio de limpieza.', lat_aprox: -12.08, lng_aprox: -77.07, usuario_id: 'u8', es_emprendimiento: 1, activo: 1, oculto: 0, creado_en: new Date().toISOString(), actualizado_en: new Date().toISOString() },
      { id: 's8', zona_id: 'z4', categoria: 'mecanica', titulo: 'Mecánico a domicilio', descripcion: 'Reparación de autos.', lat_aprox: -12.081, lng_aprox: -77.071, usuario_id: 'u9', es_emprendimiento: 1, activo: 1, oculto: 0, creado_en: new Date().toISOString(), actualizado_en: new Date().toISOString() },
      { id: 's9', zona_id: 'z5', categoria: 'computacion', titulo: 'Soporte PC', descripcion: 'Reparación de computadoras.', lat_aprox: -12.09, lng_aprox: -77.08, usuario_id: 'u10', es_emprendimiento: 1, activo: 1, oculto: 0, creado_en: new Date().toISOString(), actualizado_en: new Date().toISOString() },
      { id: 's10', zona_id: 'z5', categoria: 'costura', titulo: 'Modista', descripcion: 'Confección de ropa.', lat_aprox: -12.091, lng_aprox: -77.081, usuario_id: 'u11', es_emprendimiento: 1, activo: 1, oculto: 0, creado_en: new Date().toISOString(), actualizado_en: new Date().toISOString() },
      { id: 's11', zona_id: 'z1', categoria: 'gasfiteria', titulo: 'Gasfiter económico', descripcion: 'Servicio rápido.', lat_aprox: -12.052, lng_aprox: -77.042, usuario_id: 'u12', es_emprendimiento: 0, activo: 1, oculto: 0, creado_en: new Date().toISOString(), actualizado_en: new Date().toISOString() },
      { id: 's12', zona_id: 'z2', categoria: 'electricidad', titulo: 'Electricista express', descripcion: 'Emergencias eléctricas.', lat_aprox: -12.062, lng_aprox: -77.052, usuario_id: 'u13', es_emprendimiento: 0, activo: 1, oculto: 0, creado_en: new Date().toISOString(), actualizado_en: new Date().toISOString() },
      { id: 's13', zona_id: 'z3', categoria: 'pintura', titulo: 'Pintor express', descripcion: 'Pintura rápida.', lat_aprox: -12.072, lng_aprox: -77.062, usuario_id: 'u14', es_emprendimiento: 0, activo: 1, oculto: 0, creado_en: new Date().toISOString(), actualizado_en: new Date().toISOString() },
      { id: 's14', zona_id: 'z4', categoria: 'limpieza', titulo: 'Limpieza rápida', descripcion: 'Limpieza express.', lat_aprox: -12.082, lng_aprox: -77.072, usuario_id: 'u15', es_emprendimiento: 0, activo: 1, oculto: 0, creado_en: new Date().toISOString(), actualizado_en: new Date().toISOString() },
      { id: 's15', zona_id: 'z5', categoria: 'computacion', titulo: 'Soporte rápido', descripcion: 'Soporte PC express.', lat_aprox: -12.092, lng_aprox: -77.082, usuario_id: 'u16', es_emprendimiento: 0, activo: 1, oculto: 0, creado_en: new Date().toISOString(), actualizado_en: new Date().toISOString() }
    ];
    for (const s of seeds) await this.dao.guardar(s as Record<string, unknown>);
  }
}
export const servicioRepository = new ServicioRepository();
