import type { Grupo as GrupoFila, TipoGrupo, UUID } from '../tipos/tipos';
import { ERRORES_COMUNES, asegurar } from '../tipos/errores';

export type { TipoGrupo } from '../tipos/tipos';

export interface GrupoProps {
	id: UUID;
	zona_id: UUID;
	padre_id?: UUID | null;
	tipo: TipoGrupo;
	nombre: string;
	reglas?: string;
	creado_por?: UUID;
	creado_en?: string;
	modo_emergencia?: boolean;
}

export class Grupo implements GrupoFila {
	readonly id: UUID;
	readonly zona_id: UUID;
	readonly padre_id: UUID | null;
	readonly tipo: TipoGrupo;
	readonly nombre: string;
	readonly reglas: string;
	readonly creado_por: UUID;
	readonly creado_en: string;
	private _modo_emergencia: boolean;

	constructor(props: GrupoProps) {
		asegurar(props.nombre.trim().length >= 3 && props.nombre.trim().length <= 60, ERRORES_COMUNES.VALIDACION('El nombre del grupo debe tener entre 3 y 60 caracteres.'));
		asegurar((props.reglas ?? '').length <= 1000, ERRORES_COMUNES.VALIDACION('Las reglas no pueden exceder 1000 caracteres.'));
		this.id = props.id;
		this.zona_id = props.zona_id;
		this.padre_id = props.padre_id ?? null;
		this.tipo = props.tipo;
		this.nombre = props.nombre.trim();
		this.reglas = props.reglas ?? '';
		this.creado_por = props.creado_por ?? '';
		this.creado_en = props.creado_en ?? new Date().toISOString();
		this._modo_emergencia = props.modo_emergencia ?? false;
	}

	get modo_emergencia(): boolean {
		return this._modo_emergencia;
	}

	get modoEmergencia(): boolean {
		return this._modo_emergencia;
	}

	cambiarModoEmergencia(activado: boolean): void {
		this._modo_emergencia = activado;
	}
}

