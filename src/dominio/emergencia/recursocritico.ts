import type {
	ModoRecurso,
	RecursoCritico as RecursoFila,
	TipoRecursoCritico,
	UUID
} from '../tipos/tipos';
import { ERRORES_COMUNES, asegurar } from '../tipos/errores';
import { validarCoordenadas } from '../tipos/geohash';

export interface RecursoCriticoProps {
	id: UUID;
	emergencia_id?: UUID | null;
	usuario_id: UUID;
	zona_id: UUID;
	tipo: TipoRecursoCritico;
	modo: ModoRecurso;
	detalle: string;
	lat_aprox: number;
	lng_aprox: number;
	disponible?: 0 | 1 | boolean;
	oculto?: 0 | 1 | boolean;
	creado_en?: string;
}

export class RecursoCritico implements RecursoFila {
	readonly id: UUID;
	readonly emergencia_id: UUID | null;
	readonly usuario_id: UUID;
	readonly zona_id: UUID;
	readonly tipo: TipoRecursoCritico;
	readonly modo: ModoRecurso;
	readonly detalle: string;
	readonly lat_aprox: number;
	readonly lng_aprox: number;
	private _disponible: 0 | 1;
	readonly oculto: 0 | 1;
	readonly creado_en: string;

	constructor(props: RecursoCriticoProps) {
		asegurar(
			props.detalle.trim().length > 0 && props.detalle.trim().length <= 200,
			ERRORES_COMUNES.VALIDACION('El detalle debe tener hasta 200 caracteres.')
		);
		validarCoordenadas(props.lat_aprox, props.lng_aprox);
		this.id = props.id;
		this.emergencia_id = props.emergencia_id ?? null;
		this.usuario_id = props.usuario_id;
		this.zona_id = props.zona_id;
		this.tipo = props.tipo;
		this.modo = props.modo;
		this.detalle = props.detalle.trim();
		this.lat_aprox = props.lat_aprox;
		this.lng_aprox = props.lng_aprox;
		this._disponible = props.disponible === 0 ? 0 : 1;
		this.oculto = props.oculto ? 1 : 0;
		this.creado_en = props.creado_en ?? new Date().toISOString();
	}

	get disponible(): 0 | 1 {
		return this._disponible;
	}

	estaDisponible(): boolean {
		return this._disponible === 1 && this.oculto === 0;
	}

	actualizarDisponibilidad(estado: boolean | 0 | 1): void {
		this._disponible = estado ? 1 : 0;
	}
}
