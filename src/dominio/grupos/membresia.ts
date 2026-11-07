import { Rol } from '../roles/rbac.ts/rbac';

export type EstadoMembresia = 'pendiente' | 'activa' | 'suspendida';

export interface MembresiaProps {
  usuarioId: string;
  grupoId: string;
  rol: Rol;
  estado: EstadoMembresia;
  fechaIngreso: Date;
}

export class Membresia {
  readonly usuarioId: string;
  readonly grupoId: string;
  private _rol: Rol;
  private _estado: EstadoMembresia;
  readonly fechaIngreso: Date;

  constructor(props: MembresiaProps) {
    this.usuarioId = props.usuarioId;
    this.grupoId = props.grupoId;
    this._rol = props.rol;
    this._estado = props.estado;
    this.fechaIngreso = props.fechaIngreso;
  }

  get rol(): Rol {
    return this._rol;
  }

  get estado(): EstadoMembresia {
    return this._estado;
  }

  actualizarEstado(nuevoEstado: EstadoMembresia): void {
    this._estado = nuevoEstado;
  }

  cambiarRol(nuevoRol: Rol): void {
    this._rol = nuevoRol;
  }
}
