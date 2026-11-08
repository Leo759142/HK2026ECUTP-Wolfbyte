import { baseDao } from '../dao/base.dao';
import { alertaDao } from '../dao/alerta.dao';

// Repository por dominio/agregado: alertas — RF/CU/tabla. Orquesta DAO + dominio + outbox.
export class AlertaRepository {
	private entidad = 'alertas';
	private dao = alertaDao;
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
				id: 'a1',
				zona_id: 'z1',
				tipo: 'robo',
				descripcion: 'Robo en esquina',
				lat_aprox: -12.05,
				lng_aprox: -77.04,
				estado: 'activa',
				creado_en: new Date().toISOString()
			},
			{
				id: 'a2',
				zona_id: 'z2',
				tipo: 'incendio',
				descripcion: 'Incendio en mercado',
				lat_aprox: -12.06,
				lng_aprox: -77.05,
				estado: 'activa',
				creado_en: new Date().toISOString()
			},
			{
				id: 'a3',
				zona_id: 'z3',
				tipo: 'accidente',
				descripcion: 'Accidente de tránsito',
				lat_aprox: -12.07,
				lng_aprox: -77.06,
				estado: 'resuelta',
				creado_en: new Date().toISOString()
			},
			{
				id: 'a4',
				zona_id: 'z4',
				tipo: 'robo',
				descripcion: 'Robo en tienda',
				lat_aprox: -12.08,
				lng_aprox: -77.07,
				estado: 'activa',
				creado_en: new Date().toISOString()
			},
			{
				id: 'a5',
				zona_id: 'z5',
				tipo: 'incendio',
				descripcion: 'Incendio en casa',
				lat_aprox: -12.09,
				lng_aprox: -77.08,
				estado: 'resuelta',
				creado_en: new Date().toISOString()
			}
		];
		for (const a of seeds) await this.dao.guardar(a as Record<string, unknown>);
	}
}
export const alertaRepository = new AlertaRepository();
