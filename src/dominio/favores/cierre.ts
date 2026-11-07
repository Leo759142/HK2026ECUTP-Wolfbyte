export interface ConfirmacionCierre {
  favorId: string;
  usuarioId: string; // Vecino emisor de la confirmación
  fecha: Date;
}

export class ServicioCierreFavor {
  /**
   * Verifica de manera pura si un favor cumple con las condiciones para cerrarse.
   * Ambas partes deben haber pulsado de forma independiente "Se cumplió".
   */
  static evaluarCierreMutuo(
    favorId: string,
    solicitanteId: string,
    colaboradorId: string,
    listaConfirmaciones: ConfirmacionCierre[]
  ): boolean {
    const confirmacionesDelFavor = listaConfirmaciones.filter(c => c.favorId === favorId);
    
    const haConfirmadoSolicitante = confirmacionesDelFavor.some(c => c.usuarioId === solicitanteId);
    const haConfirmadoColaborador = confirmacionesDelFavor.some(c => c.usuarioId === colaboradorId);

    return haConfirmadoSolicitante && haConfirmadoColaborador;
  }
}