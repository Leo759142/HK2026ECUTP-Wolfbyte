/**
 * Gestor de idiomas mejorado con soporte para:
 *  - Parámetro de URL ?lang=<codigo> (ISO 639-3 o código corto)
 *  - Códigos ISO 639-3 extendidos (spa0000, eng0000, qu0000)
 *  - Códigos Glottolog para referencia académica y escalabilidad futura
 *  - Persistencia en localStorage
 *  - Web Worker opcional para carga async de diccionarios grandes
 *  - Retrocompatibilidad total con translate() y GestorIdiomas existente
 */

import type { Idioma } from '../dominio/tipos/tipos';
import { IDIOMAS as IDIOMAS_CORTO } from '../dominio/tipos/tipos';
import {
	normalizarIdioma,
	obtenerCodigoISO,
	obtenerCodigoGlottolog,
	obtenerNombreIdioma,
	CODIGOS_ISO_639_3,
	IDIOMAS_DISPONIBLES
} from './codigos';
import { DICCIONARIO_LOCAL, translate as translateBase } from './index';

const LS_IDIOMA = 'ayni:v1:idioma';
const URL_PARAM_IDIOMA = 'lang';

function obtenerIdiomaDesdeURL(): string | null {
	if (typeof window === 'undefined' || !window.location) return null;
	const params = new URLSearchParams(window.location.search);
	return params.get(URL_PARAM_IDIOMA);
}

function resolverIdiomaActual(): Idioma {
	const desdeURL = obtenerIdiomaDesdeURL();
	if (desdeURL) {
		const normalizado = normalizarIdioma(desdeURL);
		guardarIdiomaPersistido(normalizado);
		return normalizado as Idioma;
	}

	const persistido = localStorage.getItem(LS_IDIOMA);
	if (persistido) {
		const normalizado = normalizarIdioma(persistido);
		return normalizado as Idioma;
	}

	if (typeof navigator !== 'undefined') {
		const navegador = navigator.language?.toLowerCase().slice(0, 2);
		if (navegador === 'en') return 'en';
		if (navegador === 'qu') return 'qu';
	}

	return 'es';
}

function guardarIdiomaPersistido(idioma: Idioma): void {
	try {
		localStorage.setItem(LS_IDIOMA, idioma);
	} catch {
		// localStorage no disponible
	}
}

export class GestorIdiomasMejorado {
	private _idiomaActual: Idioma;
	private escuchadores: Array<(idioma: Idioma) => void> = [];
	private worker: Worker | null = null;
	private diccionariosCargados: Set<string> = new Set();

	constructor(idiomaInicial: Idioma = 'es', usarWorker: boolean = false) {
		this._idiomaActual = idiomaInicial;

		if (usarWorker && typeof Worker !== 'undefined') {
			try {
				this.worker = new Worker(new URL('./trabajador-traducciones.ts', import.meta.url));
				this.worker.onmessage = (event: MessageEvent) => {
					const { tipo, idioma, datos } = event.data;
					if (tipo === 'diccionario' && datos) {
						this.diccionariosCargados.add(idioma);
					}
				};
			} catch {
				this.worker = null;
			}
		}
	}

	get idiomaActual(): Idioma {
		return this._idiomaActual;
	}

	get codigoISO(): string {
		return obtenerCodigoISO(this._idiomaActual);
	}

	get codigoGlottolog(): string | null {
		return obtenerCodigoGlottolog(this._idiomaActual);
	}

	get nombreIdioma(): string {
		return obtenerNombreIdioma(this._idiomaActual);
	}

	get urlParam(): string {
		return `?lang=${this._idiomaActual}`;
	}

	cambiarIdioma(nuevoIdioma: Idioma | string): void {
		const normalizado = normalizarIdioma(nuevoIdioma) as Idioma;
		if (normalizado === this._idiomaActual) return;

		this._idiomaActual = normalizado;
		guardarIdiomaPersistido(normalizado);

		if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
			const url = new URL(window.location.href);
			url.searchParams.set(URL_PARAM_IDIOMA, normalizado);
			window.history.replaceState({}, '', url.toString());
		}

		this.escuchadores.forEach((cb) => cb(normalizado));
	}

	t(clave: string): string {
		return translateBase(this._idiomaActual, clave);
	}

	tConVars(clave: string, vars: Record<string, string | number>): string {
		let texto = this.t(clave);
		Object.entries(vars).forEach(([key, valor]) => {
			texto = texto.replace(new RegExp(`{{${key}}}`, 'g'), String(valor));
		});
		return texto;
	}

	onCambioIdioma(callback: (idioma: Idioma) => void): () => void {
		this.escuchadores.push(callback);
		return () => {
			this.escuchadores = this.escuchadores.filter((cb) => cb !== callback);
		};
	}

	async cargarDiccionarioRemoto(idioma: Idioma): Promise<void> {
		if (this.diccionariosCargados.has(idioma)) return;
		if (!this.worker) return;

		return new Promise((resolve, reject) => {
			const handler = (event: MessageEvent) => {
				const { tipo, idioma: id, datos } = event.data;
				if (tipo === 'diccionario' && id === idioma) {
					this.worker?.removeEventListener('message', handler);
					this.diccionariosCargados.add(idioma);
					resolve();
				}
				if (tipo === 'error' && id === idioma) {
					this.worker?.removeEventListener('message', handler);
					reject(new Error(String(datos)));
				}
			};
			this.worker?.addEventListener('message', handler);
			this.worker?.postMessage({ tipo: 'cargar', idioma });
		});
	}

	async cargarVariosDiccionarios(idiomas: Idioma[]): Promise<void> {
		if (!this.worker) return;
		const pendientes = idiomas.filter((i) => !this.diccionariosCargados.has(i));
		if (pendientes.length === 0) return;

		return new Promise((resolve, reject) => {
			let resueltos = 0;
			const handler = (event: MessageEvent) => {
				const { tipo, idioma: id } = event.data;
				if (tipo === 'diccionario' && pendientes.includes(id as Idioma)) {
					this.diccionariosCargados.add(id as Idioma);
					resueltos++;
					if (resueltos >= pendientes.length) {
						this.worker?.removeEventListener('message', handler);
						resolve();
					}
				}
				if (tipo === 'error') {
					resueltos++;
					if (resueltos >= pendientes.length) {
						this.worker?.removeEventListener('message', handler);
						resolve();
					}
				}
			};
			this.worker?.addEventListener('message', handler);
			this.worker?.postMessage({ tipo: 'cargarVarios', idiomas: pendientes });
		});
	}

	obtenerMetadatos(): {
		idioma: Idioma;
		codigoISO: string;
		codigoGlottolog: string | null;
		nombre: string;
		urlParam: string;
	} {
		return {
			idioma: this._idiomaActual,
			codigoISO: this.codigoISO,
			codigoGlottolog: this.codigoGlottolog,
			nombre: this.nombreIdioma,
			urlParam: this.urlParam
		};
	}
}

export const gestorIdiomas = new GestorIdiomasMejorado(resolverIdiomaActual());

export function traducir(clave: string): string {
	return gestorIdiomas.t(clave);
}

export type { Idioma, CodigoIdioma } from './codigos';
export {
	normalizarIdioma,
	obtenerCodigoISO,
	obtenerCodigoGlottolog,
	obtenerNombreIdioma,
	obtenerIdiomaDesdeURL,
	resolverIdiomaActual,
	IDIOMAS_DISPONIBLES,
	CODIGOS_ISO_639_3
};