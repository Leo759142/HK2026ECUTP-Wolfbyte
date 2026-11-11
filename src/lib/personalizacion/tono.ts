import { writable, derived, get } from 'svelte/store';
import { idioma } from '../i18n.svelte';
import type { Idioma } from '../../dominio/tipos/tipos';
import { IDIOMAS, translate } from '../../i18n';
import type {
	AdjetivoTono,
	PerfilTono,
	PreferenciaPersonalizacion
} from '../../dominio/personalizacion/tono';
import { TONES_POR_DEFECTO } from '../../dominio/personalizacion/tono';
import { tonoPorDefecto, estaHabilitado } from '../../dominio/personalizacion/tono';

const PREF_KEY = 'pod_personalizacion';

function preferenciaGuardada(): PreferenciaPersonalizacion {
	if (typeof localStorage !== 'undefined') {
		try {
			const raw = localStorage.getItem(PREF_KEY);
			if (raw) {
				const p = JSON.parse(raw) as PreferenciaPersonalizacion;
				if (
					p &&
					Object.values(TONES_POR_DEFECTO).some((t) => t.id === p.tono) &&
					typeof p.escala === 'number'
				) {
					return p;
				}
			}
		} catch {
			return tonoPorDefecto();
		}
	}
	return tonoPorDefecto();
}

export const personalizacion = writable<PreferenciaPersonalizacion>(preferenciaGuardada());

export function cambiarTono(tono: AdjetivoTono, escala: number): void {
	if (escala !== 0 && !estaHabilitado(escala)) return;
	personalizacion.update((p) => ({ ...p, tono, escala: Math.min(1, Math.max(0, escala)) }));
	if (typeof localStorage !== 'undefined') {
		const p = get(personalizacion);
		localStorage.setItem(PREF_KEY, JSON.stringify(p));
	}
}

export function desactivarPersonalizacion(): void {
	personalizacion.set({ ...get(personalizacion), escala: 0 });
	if (typeof localStorage !== 'undefined') {
		const p = get(personalizacion);
		localStorage.setItem(PREF_KEY, JSON.stringify(p));
	}
}

function aplicarAdjetivo(texto: string, tono: AdjetivoTono, escala: number): string {
	const perfil: PerfilTono = TONES_POR_DEFECTO[tono];
	if (!perfil || escala <= 0) return texto;
	let resultado = texto;
	if (perfil.prefijo && escala > 0) resultado = `${perfil.prefijo} ${resultado}`;
	if (perfil.emoji && escala > 0.5) resultado = `${perfil.emoji} ${resultado}`;
	if (perfil.sufijo && escala > 0.5) resultado = `${resultado}${perfil.sufijo}`;
	if (perfil.mayusculas && escala > 0.8) resultado = resultado.toUpperCase();
	return resultado.trim();
}

export function tConTono(clave: string, idiomaOverride?: Idioma): string {
	const lng = idiomaOverride ?? get(idioma);
	const base = translate(lng, clave);
	const p = get(personalizacion);
	if (!estaHabilitado(p.escala)) return base;
	return aplicarAdjetivo(base, p.tono, p.escala);
}

export const $tConTono = derived(
	personalizacion,
	(p) => (clave: string, idiomaOverride?: Idioma) => tConTono(clave, idiomaOverride)
);

export { TONES_POR_DEFECTO, estaHabilitado, tipoDeAdjetivo };

function tipoDeAdjetivo(tono: AdjetivoTono): string {
	return TONES_POR_DEFECTO[tono].adjetivo;
}

export type { PreferenciaPersonalizacion, AdjetivoTono };
