import type {
	CategoriaFavor,
	EstadoFavor,
	Favor as FavorFila,
	TipoFavor,
	UUID
} from '../tipos/tipos';
import { ERRORES_COMUNES, asegurar } from '../tipos/errores';
import { validarCoordenadas } from '../tipos/geohash';

export interface FavorProps {
	id: UUID;
	creador_id: UUID;
	ayudante_id?: UUID | null;
	zona_id: UUID;
	tipo: TipoFavor;
	categoria: CategoriaFavor;
	titulo: string;
	descripcion: string;
	lat_aprox: number;
	lng_aprox: number;
	estado?: EstadoFavor;
	agradecimiento?: string | null;
	oculto?: 0 | 1 | boolean;
	creado_en?: string;
	cerrado_en?: string | null;
}

export class Favor implements FavorFila {
	readonly id: UUID;
	readonly creador_id: UUID;
	private _ayudante_id: UUID | null;
	readonly zona_id: UUID;
	readonly tipo: TipoFavor;
	readonly categoria: CategoriaFavor;
	readonly titulo: string;
	readonly descripcion: string;
	readonly lat_aprox: number;
	readonly lng_aprox: number;
	private _estado: EstadoFavor;
	private _agradecimiento: string | null;
	readonly oculto: 0 | 1;
	readonly creado_en: string;
	private _cerrado_en: string | null;

	constructor(props: FavorProps) {
		asegurar(
			props.titulo.trim().length >= 3 && props.titulo.trim().length <= 80,
			ERRORES_COMUNES.VALIDACION('El título debe tener entre 3 y 80 caracteres.', {
				clave: 'error.dominio.favor.titulo_longitud',
				params: { min: 3, max: 80 }
			})
		);
		asegurar(
			props.descripcion.trim().length > 0 && props.descripcion.trim().length <= 500,
			ERRORES_COMUNES.VALIDACION('La descripción debe tener hasta 500 caracteres.', {
				clave: 'error.dominio.favor.descripcion_longitud',
				params: { max: 500 }
			})
		);
		asegurar(
			!props.agradecimiento || props.agradecimiento.length <= 200,
			ERRORES_COMUNES.VALIDACION('El agradecimiento no puede exceder 200 caracteres.', {
				clave: 'error.dominio.favor.agradecimiento_largo',
				params: { max: 200 }
			})
		);
		asegurar(
			!props.ayudante_id || props.ayudante_id !== props.creador_id,
			ERRORES_COMUNES.VALIDACION('El ayudante no puede ser el creador del favor.', {
				clave: 'error.dominio.favor.ayudante_es_creador'
			})
		);
		validarCoordenadas(props.lat_aprox, props.lng_aprox);
		this.id = props.id;
		this.creador_id = props.creador_id;
		this._ayudante_id = props.ayudante_id ?? null;
		this.zona_id = props.zona_id;
		this.tipo = props.tipo;
		this.categoria = props.categoria;
		this.titulo = props.titulo.trim();
		this.descripcion = props.descripcion.trim();
		this.lat_aprox = props.lat_aprox;
		this.lng_aprox = props.lng_aprox;
		this._estado = props.estado ?? 'abierto';
		this._agradecimiento = props.agradecimiento ?? null;
		this.oculto = props.oculto ? 1 : 0;
		this.creado_en = props.creado_en ?? new Date().toISOString();
		this._cerrado_en = props.cerrado_en ?? null;
	}

	get ayudante_id(): UUID | null {
		return this._ayudante_id;
	}

	get estado(): EstadoFavor {
		return this._estado;
	}

	get agradecimiento(): string | null {
		return this._agradecimiento;
	}

	get cerrado_en(): string | null {
		return this._cerrado_en;
	}

	asignarAyudante(ayudanteId: UUID): void {
		asegurar(
			this._estado === 'abierto',
			ERRORES_COMUNES.CONFLICTO('Solo se pueden coordinar favores abiertos.', {
				clave: 'error.dominio.favor.coordinar_no_abierto'
			})
		);
		asegurar(
			ayudanteId !== this.creador_id,
			ERRORES_COMUNES.VALIDACION('El ayudante no puede ser el creador.', {
				clave: 'error.dominio.favor.ayudante_es_creador'
			})
		);
		this._ayudante_id = ayudanteId;
		this._estado = 'en_curso';
	}

	marcarComoCompletado(agradecimiento?: string): void {
		asegurar(
			this._estado === 'en_curso',
			ERRORES_COMUNES.CONFLICTO('Un favor solo puede cerrarse si está en curso.', {
				clave: 'error.dominio.favor.cerrar_sin_en_curso'
			})
		);
		asegurar(
			!!this._ayudante_id,
			ERRORES_COMUNES.CONFLICTO('El favor requiere un ayudante para cerrarse.', {
				clave: 'error.dominio.favor.cerrar_sin_ayudante'
			})
		);
		this._estado = 'cerrado';
		this._agradecimiento = agradecimiento?.trim() || this._agradecimiento;
		this._cerrado_en = new Date().toISOString();
	}

	cancelar(): void {
		asegurar(
			this._estado === 'abierto' || this._estado === 'en_curso',
			ERRORES_COMUNES.CONFLICTO('El favor ya no puede cancelarse.', {
				clave: 'error.dominio.favor.cancelar_ya_no'
			})
		);
		this._estado = 'cancelado';
		this._cerrado_en = new Date().toISOString();
	}
}
