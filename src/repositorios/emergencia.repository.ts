import { baseDao } from '../dao/base.dao';
import { emergenciaDao } from '../dao/emergencia.dao';

// Repository por dominio/agregado: emergencias — RF/CU/tabla. Orquesta DAO + dominio + outbox.
export class EmergenciaRepository {
	private entidad = 'emergencias';
	private dao = emergenciaDao;
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
	async seedDemo(): Promise<void> {
		const existentes = await this.dao.listar();
		if (existentes.length > 0) return;
		const seeds = [
			{
				id: 'e1',
				zona_id: 'z1',
				tipo: 'sismo',
				estado: 'activa',
				descripcion: 'Sismo leve',
				creado_en: new Date().toISOString()
			},
			{
				id: 'e2',
				zona_id: 'z2',
				tipo: 'incendio',
				estado: 'resuelta',
				descripcion: 'Incendio controlado',
				creado_en: new Date().toISOString()
			},
			{
				id: 'e3',
				zona_id: 'z3',
				tipo: 'inundacion',
				estado: 'activa',
				descripcion: 'Inundación en zona baja',
				creado_en: new Date().toISOString()
			}
		];
		for (const e of seeds) await this.dao.guardar(e as Record<string, unknown>);
	}
}
export const emergenciaRepository = new EmergenciaRepository();
