import { describe, it, expect } from 'vitest';
import {
	POLITICAS_SYNC,
	obtenerPoliticaSync,
	esAppendOnly,
	esServidorManda
} from './politicas';

describe('Políticas de sincronización por entidad (RF18)', () => {
	it('todas las entidades tienen una política definida', () => {
		const entidades = [
			'recomendaciones',
			'recomendacion_etiquetas',
			'reportes',
			'favor_confirmaciones',
			'emergencia_confirmaciones',
			'servicios',
			'favores',
			'reservar_favor',
			'emergencias',
			'moderacion',
			'anuncios'
		];
		for (const e of entidades) {
			const p = obtenerPoliticaSync(e);
			expect(p.entidad).toBe(e);
			expect(p.estrategia).toMatch(/^(append_only|ultima_escritura|primero_gana|servidor_manda)$/);
		}
	});

	it('append_only: recomendaciones, reportes, confirmaciones', () => {
		expect(esAppendOnly('recomendaciones')).toBe(true);
		expect(esAppendOnly('recomendacion_etiquetas')).toBe(true);
		expect(esAppendOnly('reportes')).toBe(true);
		expect(esAppendOnly('favor_confirmaciones')).toBe(true);
		expect(esAppendOnly('emergencia_confirmaciones')).toBe(true);
	});

	it('append_only: servicios y favores NO son append_only', () => {
		expect(esAppendOnly('servicios')).toBe(false);
		expect(esAppendOnly('favores')).toBe(false);
	});

	it('servidor_manda: emergencias, moderacion, anuncios', () => {
		expect(esServidorManda('emergencias')).toBe(true);
		expect(esServidorManda('moderacion')).toBe(true);
		expect(esServidorManda('anuncios')).toBe(true);
	});

	it('servidor_manda: servicios y favores NO son server_manda', () => {
		expect(esServidorManda('servicios')).toBe(false);
		expect(esServidorManda('favores')).toBe(false);
	});

	it('entidad desconocida usa ultima_escritura por defecto', () => {
		const p = obtenerPoliticaSync('entidad_inexistente');
		expect(p.estrategia).toBe('ultima_escritura');
		expect(esAppendOnly('entidad_inexistente')).toBe(false);
		expect(esServidorManda('entidad_inexistente')).toBe(false);
	});

	it('primero_gana: reservar_favor', () => {
		const p = obtenerPoliticaSync('reservar_favor');
		expect(p.estrategia).toBe('primero_gana');
	});

	it('la lista de políticas es inmutable (no se puede modificar)', () => {
		const longitudOriginal = POLITICAS_SYNC.length;
		// Intentar modificar: no debe cambiar la longitud
		(POLITICAS_SYNC as unknown[]).push({ entidad: 'x', estrategia: 'append_only', nota: '' });
		expect(POLITICAS_SYNC.length).toBe(longitudOriginal);
	});
});