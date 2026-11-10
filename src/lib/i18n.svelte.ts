/** RF23/RF24: i18n deshardcodeado para la UI (es / qu). */
import type { Idioma } from '../dominio/tipos/tipos';
import { IDIOMAS, translate } from '../i18n';
import { writable, derived, get } from 'svelte/store';

const IDIOMA_KEY = 'pod_idioma';

function idiomaGuardado(): Idioma {
	if (typeof localStorage !== 'undefined') {
		const v = localStorage.getItem(IDIOMA_KEY);
		if (v && IDIOMAS.includes(v as Idioma)) return v as Idioma;
	}
	return 'es';
}

export const idioma = writable<Idioma>(idiomaGuardado());

export function cambiarIdioma(nuevo: Idioma): void {
	if (!IDIOMAS.includes(nuevo)) return;
	idioma.set(nuevo);
	if (typeof localStorage !== 'undefined') localStorage.setItem(IDIOMA_KEY, nuevo);
}

export function t(clave: string): string {
	return translate(get(idioma), clave);
}

export const $t = derived(idioma, (lng) => (clave: string) => translate(lng, clave));

export { IDIOMAS };