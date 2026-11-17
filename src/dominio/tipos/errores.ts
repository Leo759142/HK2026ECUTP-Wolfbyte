/**
 * Errores de dominio.
 *
 * `ErrorDeDominio` mantiene retrocompatibilidad total (constructor de 2 args),
 * pero acepta un tercer argumento opcional con metadatos de i18n:
 *  - `clave`: clave del diccionario i18n (`error.dominio.*`).
 *  - `params`: variables `{{var}}` para la traducción.
 *
 * El dominio NO importa i18n: sólo describe *qué* falló (código + clave). La
 * traducción ocurre en la UI vía `mensajeErrorDominio()` (ver `src/i18n/errores.ts`).
 * Así el mismo error se puede mostrar en es/en/qu sin tocar el dominio.
 */

export interface OpcionesError {
	/** Clave i18n (`error.dominio.*`) para traducir el mensaje en la UI. */
	clave?: string;
	/** Variables `{{var}}` para la traducción. */
	params?: Record<string, string | number>;
}

export class ErrorDeDominio extends Error {
	constructor(
		public readonly codigo: string,
		mensaje: string,
		public readonly opciones: OpcionesError = {}
	) {
		super(mensaje);
		this.name = 'ErrorDeDominio';
	}
}

export const ERRORES_COMUNES = {
	PERMISO_DENEGADO: () =>
		new ErrorDeDominio(
			'PERMISO_DENEGADO',
			'Tu rol no cuenta con los permisos necesarios para realizar esta acción.',
			{ clave: 'error.dominio.permiso_denegado' }
		),
	MEMBRESIA_INACTIVA: () =>
		new ErrorDeDominio(
			'MEMBRESIA_INACTIVA',
			'Tu acceso se encuentra pendiente de aprobación o suspendido.',
			{ clave: 'error.dominio.membresia_inactiva' }
		),
	RED_DESCONECTADA: () =>
		new ErrorDeDominio(
			'RED_DESCONECTADA',
			'Acción guardada localmente. Se enviará de forma automática al recuperar la señal.',
			{ clave: 'error.dominio.red_desconectada' }
		),
	NO_ENCONTRADO: (entidad: string, opciones?: OpcionesError) =>
		new ErrorDeDominio(
			'NO_ENCONTRADO',
			`${entidad} no existe o no está disponible.`,
			opciones ?? { clave: 'error.dominio.no_encontrado', params: { entidad } }
		),
	VALIDACION: (detalle: string, opciones?: OpcionesError) =>
		new ErrorDeDominio('VALIDACION', detalle, opciones),
	CONFLICTO: (detalle: string, opciones?: OpcionesError) =>
		new ErrorDeDominio('CONFLICTO', detalle, opciones)
};

export function asegurar(condicion: unknown, error: ErrorDeDominio): asserts condicion {
	if (!condicion) throw error;
}