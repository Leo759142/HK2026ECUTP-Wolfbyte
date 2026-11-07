import { dao } from '../datos/dao';
import type { RepositorioRecomendacion } from '../dominio/repositorios';
import type { RecomendacionEvento, UUID } from '../dominio/tipos/tipos';

/** RF07 visto bueno, RF08 etiqueta derivada por eventos append-only. No editar/borrar eventos. */
export class RecomendacionRepoLocal implements RepositorioRecomendacion {
	private entidad = 'recomendaciones_eventos' as const;
	async registrarEvento(evento: RecomendacionEvento, opId = crypto.randomUUID()): Promise<RecomendacionEvento> {
		const row = { ...evento, id: opId };
		await dao.transaccion(async () => {
			await dao.aplicarLocal(this.entidad, row as unknown as Record<string, unknown>);
			await dao.encolar({ op_id: opId, entidad: `servicios/${evento.servicio_id}/recomendaciones`, operacion: 'crear', payload: evento });
		});
		return row;
	}
	async listarPorServicio(servicioId: UUID): Promise<RecomendacionEvento[]> {
		const rows = await dao.listarLocal<RecomendacionEvento>(this.entidad);
		return rows.filter((r) => r.servicio_id === servicioId);
	}
}
