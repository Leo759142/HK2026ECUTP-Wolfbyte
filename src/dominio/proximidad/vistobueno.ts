export type EtiquetaVistoBueno = 'De vecino de tu grupo' | 'Tras un favor confirmado' | 'Sin verificar';

export interface VistoBuenoProps {
  emisorId: string;
  receptorId: string; // ID del Servicio o de la Persona que recibe el aval
  comentario: string;
  fecha: Date;
  etiqueta: EtiquetaVistoBueno;
}

export class VistoBueno {
  readonly emisorId: string;
  readonly receptorId: string;
  readonly comentario: string;
  readonly fecha: Date;
  readonly etiqueta: EtiquetaVistoBueno;

  constructor(props: VistoBuenoProps) {
    // Validar invariante de negocio básica
    if (props.comentario.trim().length === 0) {
      throw new Error('El comentario del Visto Bueno no puede estar vacío.');
    }
    
    this.emisorId = props.emisorId;
    this.receptorId = props.receptorId;
    this.comentario = props.comentario;
    this.fecha = props.fecha;
    this.etiqueta = props.etiqueta;
  }
}
