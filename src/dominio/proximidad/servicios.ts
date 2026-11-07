export interface ServicioProps {
  id: string;
  emprendedorId: string;
  categoria: string;
  descripcion: string;
  horario: string;
  zona: string; // Geohash truncado
}

export class Servicio {
  readonly id: string;
  readonly emprendedorId: string;
  readonly categoria: string;
  readonly descripcion: string;
  readonly horario: string;
  readonly zona: string;

  constructor(props: ServicioProps) {
    this.id = props.id;
    this.emprendedorId = props.emprendedorId;
    this.categoria = props.categoria;
    this.descripcion = props.descripcion;
    this.horario = props.horario;
    this.zona = props.zona;
  }

  /**
   * Genera dinámicamente la etiqueta funcional legible basada en el conteo de eventos de reputación
   */
  obtenerEtiquetaRecomendacion(conteoVistosBuenos: number): string {
    if (conteoVistosBuenos === 0) {
      return 'Sin recomendaciones aún';
    }
    return `Recomendado por ${conteoVistosBuenos} vecinos de tu zona`;
  }
}
