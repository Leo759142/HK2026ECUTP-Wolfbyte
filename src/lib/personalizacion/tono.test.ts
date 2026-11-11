import { describe, it, expect } from 'vitest';
import {
	personalizacion,
	cambiarTono,
	desactivarPersonalizacion,
	tConTono,
	TONES_POR_DEFECTO,
	estaHabilitado,
	tipoDeAdjetivo,
	type PreferenciaPersonalizacion
} from './tono';
import { get } from 'svelte/store';

describe('Personalización de adjetivos/tono', () => {
	it('expone tonos por defecto con adjetivo', () => {
		expect(TONES_POR_DEFECTO.cercano.adjetivo).toBe('cercano');
		expect(TONES_POR_DEFECTO.respetuoso.adjetivo).toBe('respetuoso');
		expect(TONES_POR_DEFECTO.energico.adjetivo).toBe('energico');
		expect(TONES_POR_DEFECTO.neutro.adjetivo).toBe('neutro');
	});

	it('tipoDeAdjetivo devuelve el adjetivo del tono', () => {
		expect(tipoDeAdjetivo('cercano')).toBe('cercano');
		expect(tipoDeAdjetivo('energico')).toBe('energico');
	});

	it('estaHabilitado rechaza escala 0 y acepta positiva', () => {
		expect(estaHabilitado(0)).toBe(false);
		expect(estaHabilitado(0.3)).toBe(true);
		expect(estaHabilitado(1)).toBe(true);
	});

	it('sin personalización (escala 0) devuelve la traducción base', () => {
		personalizacion.set({
			usuarioId: 'u1',
			tono: 'cercano',
			escala: 0
		} as PreferenciaPersonalizacion);
		expect(tConTono('hola')).toBe('¡Hola');
	});

	it('escala baja aplica solo prefijo (cercano)', () => {
		personalizacion.set({
			usuarioId: 'u1',
			tono: 'cercano',
			escala: 0.3
		} as PreferenciaPersonalizacion);
		const r = tConTono('hola');
		expect(r).toContain('¡');
		expect(r).not.toContain('🤝');
		expect(r).not.toContain('vecino');
	});

	it('escala completa aplica emoji y sufijo', () => {
		personalizacion.set({
			usuarioId: 'u1',
			tono: 'cercano',
			escala: 1
		} as PreferenciaPersonalizacion);
		const r = tConTono('hola');
		expect(r).toContain('🤝');
		expect(r).toContain('vecino');
	});

	it('escala muy alta aplica mayúsculas', () => {
		personalizacion.set({
			usuarioId: 'u1',
			tono: 'energico',
			escala: 0.9
		} as PreferenciaPersonalizacion);
		const r = tConTono('hola');
		expect(r).toEqual(r.toUpperCase());
		expect(r).toContain('⚡');
		expect(r).toContain('¡YA!');
	});

	it('cambiarTono actualiza la store y desactivar la anula', () => {
		cambiarTono('respetuoso', 0.7);
		expect(get(personalizacion).tono).toBe('respetuoso');
		desactivarPersonalizacion();
		expect(get(personalizacion).escala).toBe(0);
		expect(tConTono('hola')).toBe('¡Hola');
	});

	it('idioma override respeta el idioma solicitado', () => {
		personalizacion.set({
			usuarioId: 'u1',
			tono: 'neutro',
			escala: 0
		} as PreferenciaPersonalizacion);
		expect(tConTono('hola', 'en')).toBe('Hi');
		expect(tConTono('hola', 'qu')).toBe('¡Allinllachu');
	});
});
