import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConfirmarFavor } from './confirmar-favor';
import { FavorRepoLocal } from '../../repositorios/favor.local';
import { FavorConfirmacionRepoLocal } from '../../repositorios/favor.local';
import { dao } from '../../datos/dao';
import type { Favor, CategoriaFavor, EstadoFavor, TipoFavor } from '../../dominio/tipos/tipos';

const FAVOR_ID = 'f-conf-1';

function favorConf(): Favor {
	return {
		id: FAVOR_ID,
		creador_id: 'u-solicitante',
		ayudante_id: 'u-ayudante',
		zona_id: 'z1',
		tipo: 'oferta' as TipoFavor,
		categoria: 'prestamo_herramienta' as CategoriaFavor,
		titulo: 'Favor a confirmar',
		descripcion: 'Desc.',
		estado: 'abierto',
		agradecimiento: null,
		oculto: 0,
		creado_en: new Date().toISOString(),
		cerrado_en: null,
		lat_aprox: -12.046,
		lng_aprox: -77.043
	};
}

beforeEach(async () => {
	await dao.eliminarLocal('favores', FAVOR_ID);
});
afterEach(async () => {
	await dao.eliminarLocal('favores', FAVOR_ID);
	for (const c of await dao.listarLocal<{ id: string }>('favor_confirmaciones')) {
		await dao.eliminarLocal('favor_confirmaciones', c.id);
	}
});

describe('ConfirmarFavor (servicio + repositorio)', () => {
	it('registra una confirmación y la devuelve con sus campos', async () => {
		const favorRepo = new FavorRepoLocal();
		await favorRepo.guardar(favorConf());

		const repo = new FavorConfirmacionRepoLocal();
		const uc = new ConfirmarFavor(repo);

		const confirmada = await uc.ejecutar({
			favor_id: FAVOR_ID,
			usuario_id: 'u-solicitante',
			rol_en_favor: 'solicitante'
		});

		expect(confirmada.favor_id).toBe(FAVOR_ID);
		expect(confirmada.usuario_id).toBe('u-solicitante');
		expect(confirmada.rol_en_favor).toBe('solicitante');
		expect(confirmada.metodo).toBe('boton');
		expect(typeof confirmada.confirmado_en).toBe('string');
	});

	it('permite confirmar desde el rol de ayudante', async () => {
		const favorRepo = new FavorRepoLocal();
		await favorRepo.guardar(favorConf());

		const repo = new FavorConfirmacionRepoLocal();
		const uc = new ConfirmarFavor(repo);

		const confirmada = await uc.ejecutar({
			favor_id: FAVOR_ID,
			usuario_id: 'u-ayudante',
			rol_en_favor: 'ayudante',
			metodo: 'qr'
		});

		expect(confirmada.rol_en_favor).toBe('ayudante');
		expect(confirmada.metodo).toBe('qr');
	});
});
