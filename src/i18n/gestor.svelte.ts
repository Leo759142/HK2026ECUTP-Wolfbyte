/**
 * Gestor de idiomas reactivo (Svelte 5 runes) — fuente única de verdad.
 *
 * A diferencia del antiguo gestor plano (no reactivo, que obligaba a recargar
 * la página), aquí el idioma actual vive en un campo `$state`. Eso hace que
 * cualquier plantilla que lea `gestorIdiomas.idiomaActual` o llame a
 * `gestorIdiomas.t(...)` se actualice automáticamente al cambiar de idioma,
 * sin recargar y sin hacks de `$effect`.
 *
 * Responsabilidades:
 *  - Resolver el idioma inicial (URL ?lang= > localStorage > navigator > 'es')
 *  - Persistir en `ayni:v1:idioma` y mantener compatibilidad con `settings.lang`
 *  - Reflejar el idioma en `document.documentElement.lang` y en la URL
 *  - Traducir con el diccionario local (fallback a español y a la propia clave)
 */

import {
	normalizarIdioma,
	obtenerCodigoISO,
	obtenerCodigoGlottolog,
	obtenerNombreIdioma
} from './codigos';
import { translate as translateBase } from './index';

const enNavegador = typeof window !== 'undefined';

const LS_IDIOMA = 'ayni:v1:idioma';
const LS_SETTINGS = 'ayni:v1:settings';
const URL_PARAM_IDIOMA = 'lang';

type IdiomaActual = 'es' | 'en' | 'qu';

function leerIdiomaDesdeURL(): string | null {
	if (!enNavegador || !window.location) return null;
	try {
		const params = new URLSearchParams(window.location.search);
		return params.get(URL_PARAM_IDIOMA);
	} catch {
		return null;
	}
}

function guardarIdiomaPersistido(idioma: IdiomaActual): void {
	if (!enNavegador) return;
	try {
		localStorage.setItem(LS_IDIOMA, idioma);
	} catch {
		/* localStorage no disponible */
	}
	// Compatibilidad con el sistema antiguo que guardaba en settings.lang
	try {
		const settings = JSON.parse(localStorage.getItem(LS_SETTINGS) ?? '{}') as Record<string, unknown>;
		localStorage.setItem(LS_SETTINGS, JSON.stringify({ ...settings, lang: idioma }));
	} catch {
		/* ignore */
	}
}

function resolverIdiomaInicial(): IdiomaActual {
	const desdeURL = leerIdiomaDesdeURL();
	if (desdeURL) return normalizarIdioma(desdeURL) as IdiomaActual;

	if (enNavegador) {
		try {
			const persistido = localStorage.getItem(LS_IDIOMA);
			if (persistido) return normalizarIdioma(persistido) as IdiomaActual;

			const settings = JSON.parse(localStorage.getItem(LS_SETTINGS) ?? '{}') as { lang?: string };
			if (settings.lang) return normalizarIdioma(settings.lang) as IdiomaActual;
		} catch {
			/* ignore */
		}
	}

	if (typeof navigator !== 'undefined') {
		const navegador = navigator.language?.toLowerCase().slice(0, 2);
		if (navegador === 'en') return 'en';
		if (navegador === 'qu') return 'qu';
	}

	return 'es';
}

class GestorIdiomasReactivo {
	idiomaActual = $state<IdiomaActual>(resolverIdiomaInicial());

	constructor() {
		if (enNavegador) {
			document.documentElement.lang = this.idiomaActual;
		}
	}

	get codigoISO(): string {
		return obtenerCodigoISO(this.idiomaActual);
	}

	get codigoGlottolog(): string | null {
		return obtenerCodigoGlottolog(this.idiomaActual);
	}

	get nombreIdioma(): string {
		return obtenerNombreIdioma(this.idiomaActual);
	}

	get urlParam(): string {
		return `?lang=${this.idiomaActual}`;
	}

	cambiarIdioma(nuevoIdioma: IdiomaActual | string): void {
		const normalizado = normalizarIdioma(nuevoIdioma) as IdiomaActual;
		if (normalizado === this.idiomaActual) return;

		this.idiomaActual = normalizado;
		guardarIdiomaPersistido(normalizado);

		if (enNavegador) {
			document.documentElement.lang = normalizado;
			if (window.history?.replaceState) {
				const url = new URL(window.location.href);
				url.searchParams.set(URL_PARAM_IDIOMA, normalizado);
				window.history.replaceState({}, '', url.toString());
			}
		}
	}

	t(clave: string): string {
		return translateBase(this.idiomaActual, clave);
	}

	tConVars(clave: string, vars: Record<string, string | number>): string {
		let texto = this.t(clave);
		Object.entries(vars).forEach(([key, valor]) => {
			texto = texto.replace(new RegExp(`{{${key}}}`, 'g'), String(valor));
		});
		return texto;
	}
}

export const gestorIdiomas = new GestorIdiomasReactivo();

export function traducir(clave: string): string {
	return gestorIdiomas.t(clave);
}

// Helpers y metadatos re-exportados desde sus módulos de origen
export {
	normalizarIdioma,
	obtenerCodigoISO,
	obtenerCodigoGlottolog,
	obtenerNombreIdioma,
	IDIOMAS_DISPONIBLES,
	CODIGOS_ISO_639_3
} from './codigos';

export { GestorIdiomasMejorado, resolverIdiomaActual, obtenerIdiomaDesdeURL } from './gestor';

export type { CodigoIdioma } from './codigos';
export type { Idioma } from '../dominio/tipos/tipos';