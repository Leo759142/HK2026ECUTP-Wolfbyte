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
	fotos?: string[];
}

export type Publicacion =
	| { ok: true; entidad: EntidadPublicacion; body: Record<string, unknown> }
	| { ok: false; error: string };

/**
 * Nota: cuando `ok` es `false`, `error` contiene una **clave i18n**
 * (`error.publicar.*`). La UI la traduce con `gestorIdiomas.t(pub.error)`
 * (o `traducirError`). Centralizar la clave aquí evita strings sueltos y
 * permite escalar los mensajes de validación a es/en/qu sin tocar la UI.
 */

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
		return { ok: false, error: 'error.publicar.ubicacion_invalida' };

	if (tipo === 'alerta') {
		const texto = descripcion || titulo;
		if (!texto) return { ok: false, error: 'error.publicar.alerta.descripcion_vacia' };
		if (texto.length > 300) return { ok: false, error: 'error.publicar.alerta.descripcion_larga' };
		if (!incluye(TIPOS_ALERTA, form.tipo_alerta))
			return { ok: false, error: 'error.publicar.alerta.tipo_invalido' };
		return {
			ok: true,
			entidad: 'alertas',
			body: {
				zona_id: form.zona_id,
				tipo: form.tipo_alerta,
				descripcion: texto,
				foto: form.foto ?? null,
				fotos: form.fotos ?? [],
				...ubicacion
			}
		};
	}

	if (titulo.length < 3 || titulo.length > 80)
		return { ok: false, error: 'error.publicar.titulo_longitud' };
	if (!descripcion) return { ok: false, error: 'error.publicar.descripcion_vacia' };
	if (descripcion.length > 500) return { ok: false, error: 'error.publicar.descripcion_larga' };

	if (tipo === 'favor') {
		if (!incluye(TIPOS_FAVOR, form.tipo_favor) || !incluye(CATEGORIAS_FAVOR, form.categoria_favor))
			return { ok: false, error: 'error.publicar.favor.tipo_invalido' };
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
				fotos: form.fotos ?? [],
				...ubicacion
			}
		};
	}

	if (!incluye(CATEGORIAS_SERVICIO, form.categoria))
		return { ok: false, error: 'error.publicar.servicio.categoria_invalida' };
	return {
		ok: true,
		entidad: 'servicios',
		body: {
			zona_id: form.zona_id,
			categoria: form.categoria,
			titulo,
			descripcion,
			foto: form.foto ?? null,
			fotos: form.fotos ?? [],
			...ubicacion
		}
	};
}
