/**
 * i18n de los sistemas de error — catálogo único y escalable.
 *
 * Este módulo es la **única** fuente de verdad para traducir los mensajes de
 * error de la aplicación. Centraliza:
 *  - El catálogo de claves i18n (`CODIGOS_ERROR`) agrupado por sistema
 *    (dominio, HTTP, outbox, acceso, favores, servicios, emergencia, etc.).
 *  - `traducirError()` — traduce una clave con o sin variables (`{{var}}`).
 *  - `mensajeErrorDominio()` — traduce un `ErrorDeDominio` usando su `clave`
 *    i18n (si la trae) o su `codigo` de dominio; cae al `message` como último
 *    recurso. Así el dominio lanza errores con clave y la UI los pinta
 *    traducidos sin acoplar el dominio a i18n.
 *  - `mensajeHttp()` — traduce un código de estado HTTP (400, 404, 500…).
 *
 * Para añadir un error nuevo: agrega su clave a `CODIGOS_ERROR` y las tres
 * traducciones (es/en/qu) en `./index.ts` (DICCIONARIO_LOCAL). No hay que tocar
 * ningún componente.
 */

import { gestorIdiomas } from './gestor.svelte';
import { ErrorDeDominio } from '../dominio/tipos/errores';
import type { OpcionesError } from '../dominio/tipos/errores';

export type { OpcionesError };

export type VariablesError = Record<string, string | number>;

/**
 * Catálogo de claves i18n de error. Agrupado por sistema para que sea fácil de
 * escalar y de referenciar desde el código (evita strings sueltos).
 */
export const CODIGOS_ERROR = {
	// ── Dominio (códigos de `ErrorDeDominio`) ────────────────────────────────
	PERMISO_DENEGADO: 'error.dominio.permiso_denegado',
	MEMBRESIA_INACTIVA: 'error.dominio.membresia_inactiva',
	RED_DESCONECTADA: 'error.dominio.red_desconectada',
	NO_ENCONTRADO: 'error.dominio.no_encontrado',
	VALIDACION: 'error.dominio.validacion',
	CONFLICTO: 'error.dominio.conflicto',
	GENERICO: 'error.generico',

	// ── HTTP (página de error de SvelteKit) ──────────────────────────────────
	HTTP_400: 'error.http.400',
	HTTP_401: 'error.http.401',
	HTTP_403: 'error.http.403',
	HTTP_404: 'error.http.404',
	HTTP_408: 'error.http.408',
	HTTP_429: 'error.http.429',
	HTTP_500: 'error.http.500',
	HTTP_503: 'error.http.503',
	HTTP_DEFECTO: 'error.http.default',

	// ── Página de error (chrome/UI) ──────────────────────────────────────────
	PAGINA_TITULO: 'error.pagina.titulo',
	PAGINA_CODIGO: 'error.pagina.codigo',
	PAGINA_VOLVER: 'error.pagina.volver',
	PAGINA_INICIO: 'error.pagina.inicio',
	PAGINA_REINTENTAR: 'error.pagina.reintentar',
	PAGINA_TITULO_DOCUMENTO: 'error.pagina.titulo_documento',

	// ── Outbox / sync (barra de estado en +layout.svelte) ────────────────────
	OUTBOX_MOTIVO_DEFECTO: 'error.outbox.motivo_default',
	OUTBOX_CONFLICTO: 'error.outbox.conflicto',
	OUTBOX_RECHAZADA: 'error.outbox.rechazada'
} as const;

export type CodigoError = (typeof CODIGOS_ERROR)[keyof typeof CODIGOS_ERROR];

/**
 * Traduce una clave de error con soporte de variables `{{var}}`.
 * Cae a español y luego a la propia clave (comportamiento de `gestorIdiomas`).
 */
export function traducirError(clave: string, vars?: VariablesError): string {
	return vars ? gestorIdiomas.tConVars(clave, vars) : gestorIdiomas.t(clave);
}

/**
 * Traduce un error de dominio a la cadena del idioma actual.
 *
 * - Si `ErrorDeDominio.opciones.clave` existe → traduce esa clave con sus params.
 * - Si no, mapea por `codigo` a una clave genérica de `CODIGOS_ERROR`.
 * - Si no es `ErrorDeDominio` pero es `Error` → devuelve su `message`.
 * - Cualquier otra cosa → `String(error)`.
 */
export function mensajeErrorDominio(error: unknown): string {
	if (error instanceof ErrorDeDominio) {
		const { clave, params } = error.opciones ?? {};
		if (clave) return traducirError(clave, params);

		switch (error.codigo) {
			case 'PERMISO_DENEGADO':
				return traducirError(CODIGOS_ERROR.PERMISO_DENEGADO);
			case 'MEMBRESIA_INACTIVA':
				return traducirError(CODIGOS_ERROR.MEMBRESIA_INACTIVA);
			case 'RED_DESCONECTADA':
				return traducirError(CODIGOS_ERROR.RED_DESCONECTADA);
			case 'NO_ENCONTRADO':
				return traducirError(CODIGOS_ERROR.NO_ENCONTRADO);
			default:
				return error.message;
		}
	}

	if (error instanceof Error) return error.message;
	return String(error);
}

/**
 * Traduce un código de estado HTTP. Si el status concreto no está en el
 * diccionario, cae a `error.http.default`.
 */
export function mensajeHttp(status: number): string {
	const clave = `error.http.${status}`;
	const traducido = gestorIdiomas.t(clave);
	// `gestorIdiomas.t` devuelve la propia clave cuando no existe traducción.
	return traducido === clave ? gestorIdiomas.t(CODIGOS_ERROR.HTTP_DEFECTO) : traducido;
}

export { ErrorDeDominio };