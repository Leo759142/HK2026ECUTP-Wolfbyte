import { baseDao } from '../dao/base.dao';
import { grupoDao } from '../dao/grupo.dao';

// Repository por dominio/agregado: grupos — RF/CU/tabla. Orquesta DAO + dominio + outbox.
export class GrupoRepository {
	private entidad = 'grupos';
	private dao = grupoDao;
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
				id: 'g1',
				zona_id: 'z1',
				padre_id: null,
				tipo: 'manzana',
				nombre: 'Manzana A - Los Jardines',
				reglas: 'Vecinos colaboradores.',
				creador_id: 'u2',
				creado_en: new Date().toISOString()
			},
			{
				id: 'g2',
				zona_id: 'z1',
				padre_id: null,
				tipo: 'barrio',
				nombre: 'Barrio Surco',
				reglas: 'Convivencia pacífica.',
				creador_id: 'u3',
				creado_en: new Date().toISOString()
			},
			{
				id: 'g3',
				zona_id: 'z2',
				padre_id: null,
				tipo: 'comite_emergencia',
				nombre: 'Comité de Emergencia Miraflores',
				reglas: 'Coordinación de auxilios.',
				creador_id: 'u4',
				creado_en: new Date().toISOString()
			},
			{
				id: 'g4',
				zona_id: 'z3',
				padre_id: null,
				tipo: 'interes',
				nombre: 'Grupo de Jardinería Barranco',
				reglas: 'Intercambio de plantas.',
				creador_id: 'u5',
				creado_en: new Date().toISOString()
			},
			{
				id: 'g5',
				zona_id: 'z4',
				padre_id: null,
				tipo: 'manzana',
				nombre: 'Manzana B - Chorrillos',
				reglas: 'Unión vecinal.',
				creador_id: 'u6',
				creado_en: new Date().toISOString()
			}
		];
		for (const g of seeds) await this.dao.guardar(g as Record<string, unknown>);
	}
}
export const grupoRepository = new GrupoRepository();