import type { Anuncio as AnuncioFila, EstadoAnuncio, UUID } from '../tipos/tipos';
import { ERRORES_COMUNES, asegurar } from '../tipos/errores';

export interface AnuncioProps {
	id: UUID;
	anunciante_id: UUID;
	zona_id: UUID;
	titulo: string;
	descripcion: string;
	estado?: EstadoAnuncio;
	aprobado_por?: UUID | null;
	inicio?: string;
	fin?: string | null;
	creado_en?: string;
}

export class Anuncio implements AnuncioFila {
	readonly id: UUID;
	readonly anunciante_id: UUID;
	readonly zona_id: UUID;
	readonly titulo: string;
	readonly descripcion: string;
	readonly etiqueta = 'publicidad' as const;
	readonly estado: EstadoAnuncio;
	readonly aprobado_por: UUID | null;
	readonly inicio: string;
	readonly fin: string | null;
	readonly creado_en: string;

	constructor(props: AnuncioProps) {
		asegurar(
			props.titulo.trim().length >= 3 && props.titulo.trim().length <= 80,
			ERRORES_COMUNES.VALIDACION('El título debe tener entre 3 y 80 caracteres.')
		);
		asegurar(
			props.descripcion.trim().length > 0 && props.descripcion.trim().length <= 300,
			ERRORES_COMUNES.VALIDACION('La descripción debe tener hasta 300 caracteres.')
		);
		const estado = props.estado ?? 'pendiente';
		asegurar(
			estado !== 'aprobado' || !!props.aprobado_por,
			ERRORES_COMUNES.VALIDACION('Un anuncio aprobado requiere aprobador.')
		);
		this.id = props.id;
		this.anunciante_id = props.anunciante_id;
		this.zona_id = props.zona_id;
		this.titulo = props.titulo.trim();
		this.descripcion = props.descripcion.trim();
		this.estado = estado;
		this.aprobado_por = props.aprobado_por ?? null;
		this.inicio = props.inicio ?? new Date().toISOString();
		this.fin = props.fin ?? null;
		this.creado_en = props.creado_en ?? new Date().toISOString();
	}
}

export class ReglasAnuncio {
	static evaluarVisibilidad(
		anuncio: Pick<AnuncioFila, 'estado' | 'inicio' | 'fin' | 'zona_id'>,
		modoEmergenciaActivo: boolean,
		ahora: Date = new Date()
	): boolean {
		if (modoEmergenciaActivo) return false;
		if (anuncio.estado !== 'aprobado') return false;
		const t = ahora.toISOString();
		if (anuncio.inicio > t) return false;
		if (anuncio.fin && anuncio.fin < t) return false;
		return true;
	}
}
