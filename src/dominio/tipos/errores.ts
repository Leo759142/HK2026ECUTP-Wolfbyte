export class ErrorDeDominio extends Error {
	constructor(
		public readonly codigo: string,
		mensaje: string
	) {
		super(mensaje);
		this.name = 'ErrorDeDominio';
	}
}

export const ERRORES_COMUNES = {
	PERMISO_DENEGADO: () =>
		new ErrorDeDominio(
			'PERMISO_DENEGADO',
			'Tu rol no cuenta con los permisos necesarios para realizar esta acción.'
		),
	MEMBRESIA_INACTIVA: () =>
		new ErrorDeDominio(
			'MEMBRESIA_INACTIVA',
			'Tu acceso se encuentra pendiente de aprobación o suspendido.'
		),
	RED_DESCONECTADA: () =>
		new ErrorDeDominio(
			'RED_DESCONECTADA',
			'Acción guardada localmente. Se enviará de forma automática al recuperar la señal.'
		),
	NO_ENCONTRADO: (entidad: string) =>
		new ErrorDeDominio('NO_ENCONTRADO', `${entidad} no existe o no está disponible.`),
	VALIDACION: (detalle: string) => new ErrorDeDominio('VALIDACION', detalle),
	CONFLICTO: (detalle: string) => new ErrorDeDominio('CONFLICTO', detalle)
};

export function asegurar(condicion: unknown, error: ErrorDeDominio): asserts condicion {
	if (!condicion) throw error;
}
