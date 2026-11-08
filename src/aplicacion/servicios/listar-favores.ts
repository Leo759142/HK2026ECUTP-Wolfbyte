import type { RepositorioFavor } from '../../dominio/repositorios';
import type { Favor } from '../../dominio/tipos/tipos';

/** Filtros opcionales para listar favores (RF09/RF10). */
export interface ListarFavorFiltro {
  zona_id?: string;
  estado?: string;
}

/**
 * Caso de uso: listar favores. Lee del repositorio local (offline-first).
 */
export class ListarFavor {
  constructor(private repo: RepositorioFavor) {}

  async ejecutar(filtro?: ListarFavorFiltro): Promise<Favor[]> {
    return this.repo.listar(filtro);
  }
}
