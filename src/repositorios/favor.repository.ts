import { baseDao } from '../dao/base.dao';
import { favorDao } from '../dao/favor.dao';

// Repository por dominio/agregado: favores — RF/CU/tabla. Orquesta DAO + dominio + outbox.
export class FavorRepository {
	private entidad = 'favores';
	private dao = favorDao;
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
				id: 'f1',
				zona_id: 'z1',
				tipo: 'prestamo_herramienta',
				categoria: 'prestamo_herramienta',
				titulo: 'Préstamo de escalera',
				descripcion: 'Necesito escalera de 3m por 2 días.',
				creador_id: 'u1',
				ayudante_id: null,
				estado: 'abierto',
				oculto: 0,
				agradecimiento: null,
				cerrado_en: null,
				lat_aprox: -12.046,
				lng_aprox: -77.043,
				creado_en: new Date().toISOString()
			},
			{
				id: 'f2',
				zona_id: 'z1',
				tipo: 'necesidad',
				categoria: 'movilidad',
				titulo: 'Acompañamiento a cita médica',
				descripcion: 'Adulto mayor necesita acompañante.',
				creador_id: 'u4',
				ayudante_id: 'u2',
				estado: 'en_curso',
				oculto: 0,
				agradecimiento: null,
				cerrado_en: null,
				lat_aprox: -12.046,
				lng_aprox: -77.043,
				creado_en: new Date().toISOString()
			},
			{
				id: 'f3',
				zona_id: 'z2',
				tipo: 'prestamo_herramienta',
				categoria: 'prestamo_herramienta',
				titulo: 'Préstamo de taladro',
				descripcion: 'Necesito taladro por 1 día.',
				creador_id: 'u5',
				ayudante_id: null,
				estado: 'abierto',
				oculto: 0,
				agradecimiento: null,
				cerrado_en: null,
				lat_aprox: -12.06,
				lng_aprox: -77.05,
				creado_en: new Date().toISOString()
			},
			{
				id: 'f4',
				zona_id: 'z2',
				tipo: 'necesidad',
				categoria: 'movilidad',
				titulo: 'Acompañamiento a hospital',
				descripcion: 'Persona mayor necesita acompañante.',
				creador_id: 'u6',
				ayudante_id: 'u3',
				estado: 'en_curso',
				oculto: 0,
				agradecimiento: null,
				cerrado_en: null,
				lat_aprox: -12.06,
				lng_aprox: -77.05,
				creado_en: new Date().toISOString()
			},
			{
				id: 'f5',
				zona_id: 'z3',
				tipo: 'prestamo_herramienta',
				categoria: 'prestamo_herramienta',
				titulo: 'Préstamo de escalera grande',
				descripcion: 'Necesito escalera de 5m.',
				creador_id: 'u7',
				ayudante_id: null,
				estado: 'abierto',
				oculto: 0,
				agradecimiento: null,
				cerrado_en: null,
				lat_aprox: -12.07,
				lng_aprox: -77.06,
				creado_en: new Date().toISOString()
			},
			{
				id: 'f6',
				zona_id: 'z3',
				tipo: 'necesidad',
				categoria: 'movilidad',
				titulo: 'Acompañamiento a cita',
				descripcion: 'Adulto necesita acompañante.',
				creador_id: 'u8',
				ayudante_id: 'u4',
				estado: 'en_curso',
				oculto: 0,
				agradecimiento: null,
				cerrado_en: null,
				lat_aprox: -12.07,
				lng_aprox: -77.06,
				creado_en: new Date().toISOString()
			},
			{
				id: 'f7',
				zona_id: 'z4',
				tipo: 'prestamo_herramienta',
				categoria: 'prestamo_herramienta',
				titulo: 'Préstamo de martillo',
				descripcion: 'Necesito martillo por 2 días.',
				creador_id: 'u9',
				ayudante_id: null,
				estado: 'abierto',
				oculto: 0,
				agradecimiento: null,
				cerrado_en: null,
				lat_aprox: -12.08,
				lng_aprox: -77.07,
				creado_en: new Date().toISOString()
			},
			{
				id: 'f8',
				zona_id: 'z4',
				tipo: 'necesidad',
				categoria: 'movilidad',
				titulo: 'Acompañamiento a clínica',
				descripcion: 'Persona mayor necesita ayuda.',
				creador_id: 'u10',
				ayudante_id: 'u5',
				estado: 'en_curso',
				oculto: 0,
				agradecimiento: null,
				cerrado_en: null,
				lat_aprox: -12.08,
				lng_aprox: -77.07,
				creado_en: new Date().toISOString()
			},
			{
				id: 'f9',
				zona_id: 'z5',
				tipo: 'prestamo_herramienta',
				categoria: 'prestamo_herramienta',
				titulo: 'Préstamo de sierra',
				descripcion: 'Necesito sierra por 1 día.',
				creador_id: 'u11',
				ayudante_id: null,
				estado: 'abierto',
				oculto: 0,
				agradecimiento: null,
				cerrado_en: null,
				lat_aprox: -12.09,
				lng_aprox: -77.08,
				creado_en: new Date().toISOString()
			},
			{
				id: 'f10',
				zona_id: 'z5',
				tipo: 'necesidad',
				categoria: 'movilidad',
				titulo: 'Acompañamiento a cita médica',
				descripcion: 'Adulto mayor necesita ayuda.',
				creador_id: 'u12',
				ayudante_id: 'u6',
				estado: 'en_curso',
				oculto: 0,
				agradecimiento: null,
				cerrado_en: null,
				lat_aprox: -12.09,
				lng_aprox: -77.08,
				creado_en: new Date().toISOString()
			},
			{
				id: 'f11',
				zona_id: 'z1',
				tipo: 'prestamo_herramienta',
				categoria: 'prestamo_herramienta',
				titulo: 'Préstamo de escalera (cerrado)',
				descripcion: 'Cerrado.',
				creador_id: 'u13',
				ayudante_id: 'u7',
				estado: 'cerrado',
				oculto: 0,
				agradecimiento: 'Gracias',
				cerrado_en: new Date().toISOString(),
				lat_aprox: -12.046,
				lng_aprox: -77.043,
				creado_en: new Date().toISOString()
			},
			{
				id: 'f12',
				zona_id: 'z2',
				tipo: 'necesidad',
				categoria: 'movilidad',
				titulo: 'Acompañamiento (cerrado)',
				descripcion: 'Cerrado.',
				creador_id: 'u14',
				ayudante_id: 'u8',
				estado: 'cerrado',
				oculto: 0,
				agradecimiento: 'Gracias',
				cerrado_en: new Date().toISOString(),
				lat_aprox: -12.06,
				lng_aprox: -77.05,
				creado_en: new Date().toISOString()
			}
		];
		for (const f of seeds) await this.dao.guardar(f as Record<string, unknown>);
	}
}
export const favorRepository = new FavorRepository();
