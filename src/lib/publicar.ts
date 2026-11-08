import {
	CATEGORIAS_FAVOR,
	CATEGORIAS_SERVICIO,
	TIPOS_ALERTA,
	TIPOS_FAVOR
} from '../dominio/tipos/tipos';

export type TipoPublicacion = 'servicio' | 'favor' | 'alerta';
export type EntidadPublicacion = 'servicios' | 'favores' | 'alertas';

export interface FormPublicar {
	zona_id: string;
	titulo: string;
	descripcion: string;
	categoria: string;
	tipo_favor: string;
	categoria_favor: string;
	tipo_alerta: string;
	lat_aprox: number;
	lng_aprox: number;
	foto?: string | null;
}

export type Publicacion =
	| { ok: true; entidad: EntidadPublicacion; body: Record<string, unknown> }
	| { ok: false; error: string };

export function tipoDesdeUrl(valor: string | null): TipoPublicacion {
	return valor === 'favor' || valor === 'alerta' ? valor : 'servicio';
}

const incluye = (lista: readonly string[], v: string) => lista.includes(v);

/**
 * Valida en el cliente (mismas reglas que la API) y arma lo que va a la cola.
 * Se valida antes de encolar porque, sin señal, un 422 del servidor llegaría tarde.
 */
export function construirPublicacion(tipo: TipoPublicacion, form: FormPublicar): Publicacion {
	const titulo = form.titulo.trim();
	const descripcion = form.descripcion.trim();
	const ubicacion = { lat_aprox: form.lat_aprox, lng_aprox: form.lng_aprox };
	if (!Number.isFinite(form.lat_aprox) || !Number.isFinite(form.lng_aprox))
		return { ok: false, error: 'La ubicación aproximada no es válida.' };

	if (tipo === 'alerta') {
		const texto = descripcion || titulo;
		if (!texto) return { ok: false, error: 'Describe brevemente la necesidad.' };
		if (texto.length > 300)
			return { ok: false, error: 'La descripción puede tener hasta 300 caracteres.' };
		if (!incluye(TIPOS_ALERTA, form.tipo_alerta))
			return { ok: false, error: 'Elige un tipo de alerta.' };
		return {
			ok: true,
			entidad: 'alertas',
			body: {
				zona_id: form.zona_id,
				tipo: form.tipo_alerta,
				descripcion: texto,
				foto: form.foto ?? null,
				...ubicacion
			}
		};
	}

	if (titulo.length < 3 || titulo.length > 80)
		return { ok: false, error: 'El título debe tener entre 3 y 80 caracteres.' };
	if (!descripcion) return { ok: false, error: 'Agrega una descripción corta.' };
	if (descripcion.length > 500)
		return { ok: false, error: 'La descripción puede tener hasta 500 caracteres.' };

	if (tipo === 'favor') {
		if (!incluye(TIPOS_FAVOR, form.tipo_favor) || !incluye(CATEGORIAS_FAVOR, form.categoria_favor))
			return { ok: false, error: 'Elige el tipo de favor.' };
		return {
			ok: true,
			entidad: 'favores',
			body: {
				zona_id: form.zona_id,
				tipo: form.tipo_favor,
				categoria: form.categoria_favor,
				titulo,
				descripcion,
				foto: form.foto ?? null,
				...ubicacion
			}
		};
	}

	if (!incluye(CATEGORIAS_SERVICIO, form.categoria))
		return { ok: false, error: 'Elige una categoría.' };
	return {
		ok: true,
		entidad: 'servicios',
		body: {
			zona_id: form.zona_id,
			categoria: form.categoria,
			titulo,
			descripcion,
			foto: form.foto ?? null,
			...ubicacion
		}
	};
}
