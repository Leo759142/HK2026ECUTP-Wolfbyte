export type TipoRecurso = 'Agua' | 'Gas' | 'Medicinas' | 'Refugio';

export interface RecursoCriticoProps {
  id: string;
  grupoId: string;
  tipo: TipoRecurso;
  disponibilidad: boolean;
  geohashAproximado: string;
}

export class RecursoCritico {
  readonly id: string;
  readonly grupoId: string;
  readonly tipo: TipoRecurso;
  readonly geohashAproximado: string;
  private _disponibilidad: boolean;

  constructor(props: RecursoCriticoProps) {
    this.id = props.id;
    this.grupoId = props.grupoId;
    this.tipo = props.tipo;
    this.geohashAproximado = props.geohashAproximado;
    this._disponibilidad = props.disponibilidad;
  }

  get disponibilidad(): boolean {
    return this._disponibilidad;
  }

  actualizarDisponibilidad(estado: boolean): void {
    this._disponibilidad = estado;
  }
}
