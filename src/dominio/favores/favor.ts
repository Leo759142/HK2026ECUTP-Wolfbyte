import type { EventoComun } from '../compartido/tipos';

export type EstadoFavor = 'Abierto' | 'Acordado' | 'Cerrado y confirmado';

export interface FavorProps {
  id: string;
  usuarioId: string;
  titulo: string;
  descripcion: string;
  estado: EstadoFavor;
  fechaCreacion: Date;
}

export class Favor implements EventoComun {
  readonly id: string;
  readonly usuarioId: string;
  readonly creadoEn: Date;
  readonly titulo: string;
  readonly descripcion: string;
  private _estado: EstadoFavor;

  constructor(props: FavorProps) {
    this.id = props.id;
    this.usuarioId = props.usuarioId;
    this.titulo = props.titulo;
    this.descripcion = props.descripcion;
    this._estado = props.estado;
    this.creadoEn = props.fechaCreacion;
  }

  get estado(): EstadoFavor {
    return this._estado;
  }

  /**
   * Muta el estado a Acordado cuando un vecino se ofrece a colaborar.
   */
  asignarAyudante(): void {
    if (this._estado !== 'Abierto') {
      throw new Error('Solo se pueden coordinar favores que estén en estado Abierto.');
    }
    this._estado = 'Acordado';
  }

  /**
   * Cierre definitivo del favor delegando la validación mutua a las políticas.
   */
  marcarComoCompletado(): void {
    if (this._estado !== 'Acordado') {
      throw new Error('Un favor solo puede cerrarse de mutuo acuerdo si previamente fue Acordado.');
    }
    this._estado = 'Cerrado y confirmado';
  }
}
