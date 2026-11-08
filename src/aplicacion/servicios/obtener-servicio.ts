import type { RepositorioServicio } from '../../dominio/repositorios';
import type { Servicio, UUID } from '../../dominio/tipos/tipos';

/**
 * Caso de uso: obtener un servicio por id.
 */
export class ObtenerServicio {
  constructor(private repo: RepositorioServicio) {}

  async ejecutar(id: UUID): Promise<Servicio | null> {
    return this.repo.obtener(id);
  }
}
