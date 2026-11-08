import type { RepositorioFavorConfirmacion } from '../../dominio/repositorios';
import type {
	FavorConfirmacion,
	MetodoConfirmacion,
	RolEnFavor,
	UUID
} from '../../dominio/tipos/tipos';

/** DTO de entrada para confirmar que un favor se cumplió (RF11 / CU08). */
export interface ConfirmarFavorInput {
	favor_id: UUID;
	usuario_id: UUID;
	rol_en_favor: RolEnFavor;
	metodo?: MetodoConfirmacion;
}

/**
 * Caso de uso: registrar confirmación mutua "Se cumplió".
 * El repositorio (`FavorConfirmacionRepoLocal`) se encarga de cerrar el favor cuando
 * confirman tanto solicitante como ayudante (cierre mutuo append-only).
 */
export class ConfirmarFavor {
	constructor(private repo: RepositorioFavorConfirmacion) {}

	async ejecutar(input: ConfirmarFavorInput): Promise<FavorConfirmacion> {
		const confirmacion: FavorConfirmacion = {
			id: crypto.randomUUID(),
			favor_id: input.favor_id,
			usuario_id: input.usuario_id,
			rol_en_favor: input.rol_en_favor,
			metodo: input.metodo ?? 'boton',
			confirmado_en: new Date().toISOString()
		};
		return this.repo.confirmar(confirmacion);
	}
}
