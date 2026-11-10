import { baseDao } from '../dao/base.dao';
import { zonaDao } from '../dao/zona.dao';

// Repository por dominio/agregado: zonas — RF/CU/tabla. Orquesta DAO + dominio + outbox.
export class ZonaRepository {
	private entidad = 'zonas';
	private dao = zonaDao;
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
	async seedDemo(): Promise<void> {
		const existentes = await this.dao.listar();
		if (existentes.length > 0) return;
		const seeds = [
			{
				id: 'z1',
				nombre: 'Zona 1 - Surco',
				distrito: 'Surco',
				provincia: 'Lima',
				departamento: 'Lima',
				lat_centro: -12.05,
				lng_centro: -77.04,
				creado_en: new Date().toISOString()
			},
			{
				id: 'z2',
				nombre: 'Zona 2 - Miraflores',
				distrito: 'Miraflores',
				provincia: 'Lima',
				departamento: 'Lima',
				lat_centro: -12.06,
				lng_centro: -77.05,
				creado_en: new Date().toISOString()
			},
			{
				id: 'z3',
				nombre: 'Zona 3 - Barranco',
				distrito: 'Barranco',
				provincia: 'Lima',
				departamento: 'Lima',
				lat_centro: -12.07,
				lng_centro: -77.06,
				creado_en: new Date().toISOString()
			},
			{
				id: 'z4',
				nombre: 'Zona 4 - Chorrillos',
				distrito: 'Chorrillos',
				provincia: 'Lima',
				departamento: 'Lima',
				lat_centro: -12.08,
				lng_centro: -77.07,
				creado_en: new Date().toISOString()
			},
			{
				id: 'z5',
				nombre: 'Zona 5 - La Molina',
				distrito: 'La Molina',
				provincia: 'Lima',
				departamento: 'Lima',
				lat_centro: -12.09,
				lng_centro: -77.08,
				creado_en: new Date().toISOString()
			}
		];
		for (const z of seeds) await this.dao.guardar(z as Record<string, unknown>);
	}
}
export const zonaRepository = new ZonaRepository();