import type { Alerta as AlertaFila, EstadoAlerta, TipoAlerta, UUID } from '../tipos/tipos';
import { ERRORES_COMUNES, asegurar } from '../tipos/errores';
import { validarCoordenadas } from '../tipos/geohash';

export interface AlertaProps {
	id: UUID;
	emergencia_id?: UUID | null;
	usuario_id: UUID;
	zona_id: UUID;
	tipo: TipoAlerta;
	descripcion: string;
	lat_aprox: number;
	lng_aprox: number;
	estado?: EstadoAlerta;
	oculto?: 0 | 1 | boolean;
	creado_en?: string;
	actualizado_en?: string;
}

export class Alerta implements AlertaFila {
	readonly id: UUID;
	readonly emergencia_id: UUID | null;
	readonly usuario_id: UUID;
	readonly zona_id: UUID;
	readonly tipo: TipoAlerta;
	readonly descripcion: string;
	readonly lat_aprox: number;
	readonly lng_aprox: number;
	private _estado: EstadoAlerta;
	readonly oculto: 0 | 1;
	readonly creado_en: string;
	private _actualizado_en: string;

	constructor(props: AlertaProps) {
		asegurar(
			props.descripcion.trim().length > 0 && props.descripcion.trim().length <= 300,
			ERRORES_COMUNES.VALIDACION('La descripción debe tener hasta 300 caracteres.')
		);
		validarCoordenadas(props.lat_aprox, props.lng_aprox);
		this.id = props.id;
		this.emergencia_id = props.emergencia_id ?? null;
		this.usuario_id = props.usuario_id;
		this.zona_id = props.zona_id;
		this.tipo = props.tipo;
		this.descripcion = props.descripcion.trim();
		this.lat_aprox = props.lat_aprox;
		this.lng_aprox = props.lng_aprox;
		this._estado = props.estado ?? 'sin_verificar';
		this.oculto = props.oculto ? 1 : 0;
		this.creado_en = props.creado_en ?? new Date().toISOString();
		this._actualizado_en = props.actualizado_en ?? this.creado_en;
	}

	get estado(): EstadoAlerta {
		return this._estado;
	}

	get actualizado_en(): string {
		return this._actualizado_en;
	}

	confirmarPorVecinos(): void {
		if (this._estado === 'sin_verificar') this._setEstado('confirmado_vecinos');
	}

	marcarAtendida(): void {
		this._setEstado('atendido');
	}

	descartar(): void {
		this._setEstado('descartado');
	}

	private _setEstado(estado: EstadoAlerta): void {
		this._estado = estado;
		this._actualizado_en = new Date().toISOString();
	}
}
