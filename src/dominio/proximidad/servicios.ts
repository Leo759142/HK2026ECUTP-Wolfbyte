import type { CategoriaServicio, Servicio as ServicioFila, UUID } from '../tipos/tipos';
import { ERRORES_COMUNES, asegurar } from '../tipos/errores';
import { validarCoordenadas } from '../tipos/geohash';

export interface ServicioProps {
	id: UUID;
	usuario_id: UUID;
	zona_id: UUID;
	categoria: CategoriaServicio;
	titulo: string;
	descripcion: string;
	es_emprendimiento?: 0 | 1 | boolean;
	lat_aprox: number;
	lng_aprox: number;
	activo?: 0 | 1 | boolean;
	oculto?: 0 | 1 | boolean;
	creado_en?: string;
	actualizado_en?: string;
	horario?: string; // compat UI; no persistido en schema actual
}

export class Servicio implements ServicioFila {
	readonly id: UUID;
	readonly usuario_id: UUID;
	readonly zona_id: UUID;
	readonly categoria: CategoriaServicio;
	readonly titulo: string;
	readonly descripcion: string;
	readonly es_emprendimiento: 0 | 1;
	readonly lat_aprox: number;
	readonly lng_aprox: number;
	readonly activo: 0 | 1;
	readonly oculto: 0 | 1;
	readonly creado_en: string;
	readonly actualizado_en: string;
	readonly horario: string | null;

	constructor(props: ServicioProps) {
		asegurar(props.titulo.trim().length >= 3 && props.titulo.trim().length <= 80, ERRORES_COMUNES.VALIDACION('El título debe tener entre 3 y 80 caracteres.'));
		asegurar(props.descripcion.trim().length > 0 && props.descripcion.trim().length <= 500, ERRORES_COMUNES.VALIDACION('La descripción debe tener hasta 500 caracteres.'));
		validarCoordenadas(props.lat_aprox, props.lng_aprox);
		this.id = props.id;
		this.usuario_id = props.usuario_id;
		this.zona_id = props.zona_id;
		this.categoria = props.categoria;
		this.titulo = props.titulo.trim();
		this.descripcion = props.descripcion.trim();
		this.es_emprendimiento = props.es_emprendimiento ? 1 : 0;
		this.lat_aprox = props.lat_aprox;
		this.lng_aprox = props.lng_aprox;
		this.activo = props.activo === 0 ? 0 : 1;
		this.oculto = props.oculto ? 1 : 0;
		this.creado_en = props.creado_en ?? new Date().toISOString();
		this.actualizado_en = props.actualizado_en ?? this.creado_en;
		this.horario = props.horario ?? null;
	}

	esVisible(): boolean {
		return this.activo === 1 && this.oculto === 0;
	}

	obtenerEtiquetaRecomendacion(conteoVistosBuenos: number): string {
		if (conteoVistosBuenos <= 0) return 'Sin recomendaciones aún';
		return `Recomendado por ${conteoVistosBuenos} vecinos de tu zona`;
	}
}

