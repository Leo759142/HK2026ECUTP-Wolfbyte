import { baseDao } from '../dao/base.dao';
import { usuarioDao } from '../dao/usuario.dao';

// Repository por dominio/agregado: usuarios — RF/CU/tabla. Orquesta DAO + dominio + outbox.
export class UserRepository {
	private entidad = 'productos';
	private dao = usuarioDao;
	async listar(): Promise<any[]> {
		return this.dao.listar();
	}
	async obtener(id: string): Promise<any> {
		return this.dao.obtenerPorId(id);
	}
	async guardar(payload: any, opId = crypto.randomUUID()): Promise<any> {
		await baseDao.transaccion(async () => {
			await this.dao.guardar(payload as Record<string, unknown>);
			await baseDao.encolar({ op_id: opId, entidad: this.entidad, operacion: ' crear', payload });
		});
		return payload;
	}
	async eliminar(id: string): Promise<void> {
		await this.dao.eliminar(id);
	}
	async seedDemo(): Promise<void> {
		const existentes = await this.dao.listar();
		if (existentes.length > 0) return;
		const seeds = [
			{ id: 'u1', zona_id: 'z1', alias: 'vecino1', telefono: '+519990001', rol_plataforma: 'usuario', idioma: 'es', bloqueado: 0, creado_en: new Date().toISOString(), actualizado_en: new Date().toISOString() },
			{ id: 'u2', zona_id: 'z1', alias: 'gasfitero', telefono: '+519990002', rol_plataforma: 'usuario', idioma: 'es', bloqueado: 0, creado_en: new Date().toISOString(), actualizado_en: new Date().toISOString() },
			{ id: 'u3', zona_id: 'z1', alias: 'costurera', telefono: '+519990003', rol_plataforma: 'usuario', idioma: 'es', bloqueado: 0, creado_en: new Date().toISOString(), actualizado_en: new Date().toISOString() },
			{ id: 'u4', zona_id: 'z2', alias: 'coordinador', telefono: '+519990004', rol_plataforma: 'admin', idioma: 'es', bloqueado: 0, creado_en: new Date().toISOString(), actualizado_en: new Date().toISOString() },
			{ id: 'u5', zona_id: 'z2', alias: 'emprendedor', telefono: '+519990005', rol_plataforma: 'usuario', idioma: 'es', bloqueado: 0, creado_en: new Date().toISOString(), actualizado_en: new Date().toISOString() }
		];
		for (const u of seeds) await this.dao.guardar(u as Record<string, unknown>);
	}
}
export const usuarioRepository = new UserRepository();