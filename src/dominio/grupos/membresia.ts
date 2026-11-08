import type {
	EstadoMembresia,
	Membresia as MembresiaFila,
	RolMembresia,
	UUID
} from '../tipos/tipos';
import { ERRORES_COMUNES, asegurar } from '../tipos/errores';

export type { EstadoMembresia, RolMembresia } from '../tipos/tipos';

export interface MembresiaProps {
	grupo_id: UUID;
	usuario_id: UUID;
	rol: RolMembresia;
	estado?: EstadoMembresia;
	desde?: string;
}

export class Membresia implements MembresiaFila {
	readonly grupo_id: UUID;
	readonly usuario_id: UUID;
	private _rol: RolMembresia;
	private _estado: EstadoMembresia;
	readonly desde: string;

	constructor(props: MembresiaProps) {
		this.grupo_id = props.grupo_id;
		this.usuario_id = props.usuario_id;
		this._rol = props.rol;
		this._estado = props.estado ?? 'activa';
		this.desde = props.desde ?? new Date().toISOString();
	}

	get rol(): RolMembresia {
		return this._rol;
	}

	get estado(): EstadoMembresia {
		return this._estado;
	}

	get grupoId(): UUID {
		return this.grupo_id;
	}

	get usuarioId(): UUID {
		return this.usuario_id;
	}

	get fechaIngreso(): Date {
		return new Date(this.desde);
	}

	esActiva(): boolean {
		return this._estado === 'activa';
	}

	actualizarEstado(nuevoEstado: EstadoMembresia): void {
		this._estado = nuevoEstado;
	}

	cambiarRol(nuevoRol: RolMembresia): void {
		asegurar(this.esActiva(), ERRORES_COMUNES.MEMBRESIA_INACTIVA());
		this._rol = nuevoRol;
	}
}
