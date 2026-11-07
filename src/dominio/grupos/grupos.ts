// src/dominio/grupos/grupos.ts
export type TipoGrupo = 'manzana' | 'barrio' | 'gremio' | 'emergencia';

export interface GrupoProps {
  id: string;
  zona: string; 
  tipo: TipoGrupo;
  reglas: string[];
  modoEmergencia: boolean;
}

export class Grupo {
  readonly id: string;
  readonly zona: string;
  readonly tipo: TipoGrupo;
  readonly reglas: string[];
  private _modoEmergencia: boolean;

  constructor(props: GrupoProps) {
    this.id = props.id;
    this.zona = props.zona;
    this.tipo = props.tipo;
    this.reglas = props.reglas;
    this._modoEmergencia = props.modoEmergencia;
  }

  get modoEmergencia(): boolean {
    return this._modoEmergencia;
  }

  cambiarModoEmergencia(activado: boolean): void {
    this._modoEmergencia = activado;
  }
}
