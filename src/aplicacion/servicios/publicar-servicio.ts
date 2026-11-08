import type { RepositorioServicio } from '../../dominio/repositorios';
import type { CategoriaServicio, UUID } from '../../dominio/tipos/tipos';
import { Servicio } from '../../dominio/proximidad/servicios';
import { obtenerUsuarioCliente } from './usuario-cliente';

/** DTO de entrada para publicar un servicio (RF05 / CU01). */
export interface PublicarServicioInput {
	usuario_id?: UUID; // placeholder hasta que exista sesión real en hooks.server.ts
	zona_id: UUID;
	categoria: CategoriaServicio;
	titulo: string;
	descripcion: string;
	foto?: string | null;
	lat_aprox: number;
	lng_aprox: number;
}

/**
 * Caso de uso: publicar un servicio.
 * Valida reglas de dominio mediante la entidad `Servicio` y persiste a través del
 * repositorio (DAO local + outbox para sincronización offline, RF17/RF18).
 */
export class PublicarServicio {
	constructor(private repo: RepositorioServicio) {}

	async ejecutar(input: PublicarServicioInput): Promise<Servicio> {
		// La entidad `Servicio` valida título (3-80), descripción (1-500) y coordenadas.
		const servicio = new Servicio({
			id: crypto.randomUUID(),
			usuario_id: input.usuario_id ?? obtenerUsuarioCliente(),
			zona_id: input.zona_id,
			categoria: input.categoria,
			titulo: input.titulo,
			descripcion: input.descripcion,
			foto: input.foto,
			lat_aprox: input.lat_aprox,
			lng_aprox: input.lng_aprox
		});
		return this.repo.guardar(servicio) as unknown as Servicio;
	}
}
