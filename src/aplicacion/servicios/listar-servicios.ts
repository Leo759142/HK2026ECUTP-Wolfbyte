import type { RepositorioServicio } from '../../dominio/repositorios';
import type { Servicio } from '../../dominio/tipos/tipos';

/** Filtros opcionales para listar servicios (RF06). */
export interface ListarServiciosFiltro {
	zona_id?: string;
	categoria?: string;
}

/**
 * Caso de uso: listar servicios. Lee del repositorio (local/offline por defecto;
 * se puede cambiar a un adaptador HTTP sin tocar la UI).
 */
export class ListarServicios {
	constructor(private repo: RepositorioServicio) {}

	async ejecutar(filtro?: ListarServiciosFiltro): Promise<Servicio[]> {
		return this.repo.listar(filtro);
	}
}
