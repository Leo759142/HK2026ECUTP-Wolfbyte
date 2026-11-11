import type { Idioma } from '../../dominio/tipos/tipos';
import type {
	AnuncioCandidato,
	PerfilPublicidad,
	CategoriaInteres
} from '../../dominio/publicidad/personalizacion';
import { seleccionarAnuncio, perfilVacio } from '../../dominio/publicidad/personalizacion';

export interface AnuncioFila {
	id: string;
	titulo: string;
	descripcion: string;
	zona_id: string;
	estado: string;
	inicio: string;
	fin: string | null;
}

export function esAnuncioElegible(anuncio: AnuncioFila, ahora: Date = new Date()): boolean {
	if (anuncio.estado !== 'aprobado') return false;
	const t = ahora.toISOString();
	if (anuncio.inicio > t) return false;
	if (anuncio.fin && anuncio.fin < t) return false;
	return true;
}

export function anunciarParaUsuario(
	anuncios: AnuncioFila[],
	usuarioId: string,
	zonaId: string,
	idioma: Idioma,
	opciones?: {
		categoriasInteres?: CategoriaInteres[];
		esEmprendedor?: boolean;
		abiertoANotificaciones?: boolean;
	}
): AnuncioCandidato | null {
	const perfil: PerfilPublicidad = {
		...perfilVacio(usuarioId, zonaId, idioma),
		categoriasInteres: opciones?.categoriasInteres ?? [],
		esEmprendedor: !!opciones?.esEmprendedor,
		abiertoANotificaciones: !!opciones?.abiertoANotificaciones
	};
	const elegibles = anuncios.filter((a) => esAnuncioElegible(a));
	return seleccionarAnuncio(elegibles, perfil);
}

export type { AnuncioCandidato, PerfilPublicidad };
export { perfilVacio };
