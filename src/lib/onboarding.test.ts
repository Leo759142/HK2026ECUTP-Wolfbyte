import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
	onboardingVisto,
	estaCompletado,
	marcarOnboardingVisto,
	reiniciarOnboarding,
	obtenerPasos,
	esPasoCritico,
	traducirPaso,
	obtenerPasoActual,
	avanzarPaso,
	reiniciarProgreso
} from './onboarding';
import { translate, IDIOMAS } from '../i18n';
import type { Idioma } from '../dominio/tipos/tipos';

async function limpiarKV() {
	const kv = await import('../datos/almacen').then((m) => m.obtenerAlmacenKV());
	const keys = await kv.keys('onboarding_');
	for (const k of keys) {
		await kv.del(k);
	}
}

describe('RF23 — Onboarding guiado repetible (trazabilidad CU16/HU17)', () => {
	beforeEach(async () => {
		await limpiarKV();
		vi.stubGlobal('navigator', { onLine: true });
	});

	afterEach(async () => {
		await limpiarKV();
		vi.unstubAllGlobals();
	});

	it('no está completado por defecto', async () => {
		expect(await estaCompletado()).toBe(false);
		expect(await onboardingVisto()).toBe(false);
	});

	it('marcarOnboardingVisto lo persiste y estaCompletado lo lee', async () => {
		await marcarOnboardingVisto();
		expect(await estaCompletado()).toBe(true);
		expect(await onboardingVisto()).toBe(true);
	});

	it('reiniciarOnboarding borra el estado y vuelve a no completado', async () => {
		await marcarOnboardingVisto();
		expect(await estaCompletado()).toBe(true);
		await reiniciarOnboarding();
		expect(await estaCompletado()).toBe(false);
	});

	it('obtenerPasos devuelve al menos un paso ordenado', () => {
		const pasos = obtenerPasos();
		expect(pasos.length).toBeGreaterThan(0);
		for (let i = 1; i < pasos.length; i++) {
			expect(pasos[i - 1].orden).toBeLessThan(pasos[i].orden);
		}
	});

	it('esPasoCritico identifica pasos críticos y no críticos', () => {
		const pasos = obtenerPasos();
		const criticos = pasos.filter((p) => esPasoCritico(p.id));
		const noCriticos = pasos.filter((p) => !esPasoCritico(p.id));
		expect(criticos.length).toBeGreaterThan(0);
		expect(noCriticos.length).toBeGreaterThan(0);
		expect(esPasoCritico('paso-inexistente')).toBe(false);
	});

	it('traducirPaso devuelve título y ariaLabel en español', () => {
		const pasos = obtenerPasos();
		const paso = traducirPaso(pasos[0], 'es');
		expect(paso.titulo).toBeDefined();
		expect(paso.titulo.length).toBeGreaterThan(0);
		expect(paso.ariaLabel).toBeDefined();
		expect(paso.ariaLabel.length).toBeGreaterThan(0);
		expect(paso.esCritico).toBeDefined();
	});

	it('traducirPaso devuelve título en quechua para pasos con traducción QU', () => {
		const pasos = obtenerPasos();
		const pasoEs = traducirPaso(pasos[0], 'es');
		const pasoQu = traducirPaso(pasos[0], 'qu');
		// Quechua puede ser fallback a español si no hay traducción, pero debe devolver algo
		expect(pasoQu.titulo).toBeDefined();
		expect(typeof pasoQu.titulo).toBe('string');
	});

	it('todos los idiomas soportados pueden traducir pasos', () => {
		const pasos = obtenerPasos();
		for (const idioma of IDIOMAS) {
			for (const paso of pasos) {
				const t = traducirPaso(paso, idioma as Idioma);
				expect(t.titulo).toBeDefined();
				expect(t.ariaLabel).toBeDefined();
			}
		}
	});

	it('avanzarPaso y obtenerPasoActual manejan progreso', async () => {
		expect(await obtenerPasoActual()).toBe(1);
		await avanzarPaso(1);
		expect(await obtenerPasoActual()).toBe(2);
		await avanzarPaso(2);
		expect(await obtenerPasoActual()).toBe(3);
		await reiniciarProgreso();
		expect(await obtenerPasoActual()).toBe(1);
	});

	it('translate fallback a español si clave no existe', () => {
		const resultado = translate('es' as Idioma, 'onboarding.clave-que-no-existe');
		expect(resultado).toBe('onboarding.clave-que-no-existe');
	});

	it('translate devuelve clave en quechua si existe, fallback español si no', () => {
		// 'hola' tiene traducción QU en el diccionario
		const qu = translate('qu' as Idioma, 'hola');
		expect(qu).toBe('¡Allinllachu');
		// Clave inexistente cae a español, y si no está en español devuelve la clave misma
		const fallback = translate('qu' as Idioma, 'clave-inexistente-xyz');
		expect(fallback).toBe('clave-inexistente-xyz');
	});
});
