export class ErrorDeDominio extends Error {
  constructor(public readonly codigo: string, mensaje: string) {
    super(mensaje);
    this.name = 'ErrorDeDominio';
  }
}

export const ERRORES_COMUNES = {
  PERMISO_DENEGADO: () => new ErrorDeDominio('PERMISO_DENEGADO', 'Tu rol no cuenta con los permisos necesarios para realizar esta acción.'),
  MEMBRESIA_INACTIVA: () => new ErrorDeDominio('MEMBRESIA_INACTIVA', 'Tu acceso se encuentra pendiente de aprobación o suspendido.'),
  RED_DESCONECTADA: () => new ErrorDeDominio('RED_DESCONECTADA', 'Acción guardada localmente. Se enviará de forma automática al recuperar la señal.')
};
