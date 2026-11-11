import { describe, it, expect } from 'vitest';
import {
	seleccionarAnuncio,
	puntuarAnuncio,
	REGLAS_PUBLICIDAD,
	perfilVacio
} from '../../dominio/publicidad/personalizacion';
import { anunciarParaUsuario } from './seleccionar-anuncio';
import type { Idioma } from '../../dominio/tipos/tipos';

const ahora = new Date('2026-11-10T12:00:00Z');

const anuncioValido = {
	id: 'a1',
	titulo: 'Gasfitero cerca de ti',
	descripcion: 'Arreglo de fugas y grifos, agua caliente.',
	zona_id: 'zona-centro',
	estado: 'aprobado',
	inicio: '2026-11-01T00:00:00Z',
	fin: '2026-12-31T23:59:59Z'
};

const anuncioFueraVigencia = {
	...anuncioValido,
	id: 'a2',
	estado: 'aprobado',
	inicio: '2026-01-01T00:00:00Z',
	fin: '2026-01-31T23:59:59Z'
};

const anuncioOtraZona = {
	...anuncioValido,
	id: 'a3',
	zona_id: 'zona-norte'
};

const anuncioRechazado = {
	...anuncioValido,
	id: 'a4',
	estado: 'rechazado'
};

const perfil: import('../../dominio/publicidad/personalizacion').PerfilPublicidad = {
	usuarioId: 'u1',
	zonaId: 'zona-centro',
	idioma: 'es' as Idioma,
	categoriasInteres: ['gasfiteria'],
	esEmprendedor: false,
	abiertoANotificaciones: true
};

describe('Personalización potencial de publicidad', () => {
	it('puntuación alta cuando coincide zona, estado vigente y categoría', () => {
		const p = puntuarAnuncio(anuncioValido, perfil, REGLAS_PUBLICIDAD, ahora);
		expect(p.puntuacion).toBeGreaterThanOrEqual(70);
		expect(p.motivo).toContain('vigencia_y_estado');
		expect(p.motivo).toContain('zona_coincidente');
		expect(p.motivo).toContain('categoria_de_interes');
	});

	it('puntuación cero si está fuera de vigencia', () => {
		const p = puntuarAnuncio(anuncioFueraVigencia, perfil, REGLAS_PUBLICIDAD, ahora);
		expect(p.puntuacion).toBe(0);
	});

	it('puntuación cero si la zona no coincide', () => {
		const p = puntuarAnuncio(anuncioOtraZona, perfil, REGLAS_PUBLICIDAD, ahora);
		expect(p.motivo).not.toContain('zona_coincidente');
	});

	it('puntuación cero si el anuncio está rechazado', () => {
		const p = puntuarAnuncio(anuncioRechazado, perfil, REGLAS_PUBLICIDAD, ahora);
		expect(p.puntuacion).toBe(0);
	});

	it('seleccionarAnuncio devuelve el mejor candidato o null', () => {
		const mejor = seleccionarAnuncio(
			[anuncioRechazado, anuncioValido, anuncioFueraVigencia],
			perfil,
			REGLAS_PUBLICIDAD,
			ahora
		);
		expect(mejor?.id).toBe('a1');
		expect(mejor?.puntuacion).toBeGreaterThan(0);

		const ninguno = seleccionarAnuncio(
			[anuncioRechazado, anuncioFueraVigencia],
			perfil,
			REGLAS_PUBLICIDAD,
			ahora
		);
		expect(ninguno).toBeNull();
	});

	it('anunciarParaUsuario expone la selección desde el lib', () => {
		const resultado = anunciarParaUsuario(
			[anuncioValido, anuncioRechazado],
			'u1',
			'zona-centro',
			'es' as Idioma,
			{ categoriasInteres: ['gasfiteria'] }
		);
		expect(resultado?.id).toBe('a1');
	});

	it('perfilVacio crea un perfil sin intereses', () => {
		const p = perfilVacio('u9', 'zona-x', 'es' as Idioma);
		expect(p.categoriasInteres).toEqual([]);
		expect(p.esEmprendedor).toBe(false);
	});
});
