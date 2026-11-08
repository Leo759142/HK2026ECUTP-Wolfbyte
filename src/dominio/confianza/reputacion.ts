import type {
	Favor,
	FuenteReputacion,
	ReputacionEvento,
	ReputacionVista,
	UUID
} from '../tipos/tipos';
import type { VistoBuenoVigente } from '../tipos/tipos';

export interface PerfilReputacion extends ReputacionVista {
	insignia: 'Base' | 'Vecino Activo' | 'Emprendedor de Confianza' | 'Líder Solidario';
}

const PUNTOS_POR_FUENTE: Record<FuenteReputacion, number> = {
	visto_bueno_recibido: 5,
	visto_bueno_retirado: -5,
	favor_cerrado: 10,
	reporte_confirmado: -8,
	sancion: -15,
	bono_emprendedor: 3
};

export class CalculadorReputacion {
	static puntosParaFuente(fuente: FuenteReputacion): number {
		return PUNTOS_POR_FUENTE[fuente];
	}

	static desdeEventos(usuarioId: UUID, eventos: ReputacionEvento[]): PerfilReputacion {
		const puntos = Math.max(
			0,
			eventos.filter((e) => e.usuario_id === usuarioId).reduce((acc, e) => acc + e.puntos, 0)
		);
		return this.clasificar(usuarioId, puntos);
	}

	static calcularParaUsuario(
		usuarioId: UUID,
		vistosBuenosRecibidos: VistoBuenoVigente[],
		favoresCompletados: Array<Pick<Favor, 'creador_id' | 'ayudante_id' | 'estado'>>
	): PerfilReputacion {
		const puntosPorVistoBueno =
			vistosBuenosRecibidos.length * PUNTOS_POR_FUENTE.visto_bueno_recibido;
		const favoresCerrados = favoresCompletados.filter(
			(f) => f.estado === 'cerrado' && (f.ayudante_id === usuarioId || f.creador_id === usuarioId)
		).length;
		const puntosTotales = puntosPorVistoBueno + favoresCerrados * PUNTOS_POR_FUENTE.favor_cerrado;
		return this.clasificar(usuarioId, puntosTotales);
	}

	private static clasificar(usuario_id: UUID, reputacion: number): PerfilReputacion {
		let insignia: PerfilReputacion['insignia'] = 'Base';
		if (reputacion >= 50) insignia = 'Líder Solidario';
		else if (reputacion >= 25) insignia = 'Emprendedor de Confianza';
		else if (reputacion >= 15) insignia = 'Vecino Activo';
		return { usuario_id, reputacion, insignia };
	}
}
