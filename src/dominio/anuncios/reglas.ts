export interface AnuncioProps {
  id: string;
  zona: string;
  contenido: string;
  etiqueta: 'Patrocinado';
}

export class ReglasAnuncio {
  /**
   * Regla de exclusión comercial: Si el grupo se encuentra en modo_emergencia activo -> se ocultan todos.
   */
  static evaluarVisibilidad(anuncio: AnuncioProps, modoEmergenciaActivo: boolean): boolean {
    if (modoEmergenciaActivo) {
      return false; 
    }
    return true;
  }
}
