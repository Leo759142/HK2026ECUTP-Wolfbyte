import type { FavorConfirmacion, RolEnFavor, UUID } from '../tipos/tipos';

export interface ConfirmacionCierre {
	id?: UUID;
	favor_id: UUID;
	usuario_id: UUID;
	rol_en_favor: RolEnFavor;
	metodo: 'qr' | 'boton';
	confirmado_en?: string;
}

export class ServicioCierreFavor {
	static evaluarCierreMutuo(
		favorId: UUID,
		solicitanteId: UUID,
		ayudanteId: UUID,
		listaConfirmaciones: Array<ConfirmacionCierre | FavorConfirmacion>
	): boolean {
		const delFavor = listaConfirmaciones.filter((c) => c.favor_id === favorId);
		const haSolicitante = delFavor.some((c) => c.usuario_id === solicitanteId && c.rol_en_favor === 'solicitante');
		const haAyudante = delFavor.some((c) => c.usuario_id === ayudanteId && c.rol_en_favor === 'ayudante');
		return haSolicitante && haAyudante;
	}
}

