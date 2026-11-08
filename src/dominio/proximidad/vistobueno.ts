import type {
	RecomendacionEvento,
	TipoRecomendacionEvento,
	UUID,
	VistoBuenoVigente
} from '../tipos/tipos';
import { ERRORES_COMUNES, asegurar } from '../tipos/errores';

export interface VistoBuenoProps {
	id?: UUID;
	servicio_id: UUID;
	usuario_id: UUID;
	tipo?: TipoRecomendacionEvento;
	comentario?: string | null;
	misma_zona: 0 | 1 | boolean;
	dispositivo_hash?: string;
	creado_en?: string;
}

export class VistoBueno implements VistoBuenoVigente {
	readonly servicio_id: UUID;
	readonly usuario_id: UUID;
	readonly comentario: string | null;
	readonly misma_zona: 0 | 1;
	readonly creado_en: string;
	readonly tipo: TipoRecomendacionEvento;
	readonly dispositivo_hash: string;

	constructor(props: VistoBuenoProps) {
		const comentario = props.comentario?.trim() ?? null;
		asegurar(
			!comentario || comentario.length <= 140,
			ERRORES_COMUNES.VALIDACION('El comentario no puede exceder 140 caracteres.')
		);
		this.servicio_id = props.servicio_id;
		this.usuario_id = props.usuario_id;
		this.tipo = props.tipo ?? 'visto_bueno';
		this.comentario = comentario;
		this.misma_zona = props.misma_zona ? 1 : 0;
		this.dispositivo_hash = props.dispositivo_hash ?? 'sin-dispositivo';
		this.creado_en = props.creado_en ?? new Date().toISOString();
	}

	static vigente(
		eventos: RecomendacionEvento[],
		servicioId: UUID,
		usuarioId: UUID
	): VistoBuenoVigente | null {
		const ultimo = eventos
			.filter((e) => e.servicio_id === servicioId && e.usuario_id === usuarioId)
			.sort((a, b) => b.creado_en.localeCompare(a.creado_en) || b.id.localeCompare(a.id))[0];
		if (!ultimo || ultimo.tipo !== 'visto_bueno') return null;
		return {
			servicio_id: ultimo.servicio_id,
			usuario_id: ultimo.usuario_id,
			comentario: ultimo.comentario,
			misma_zona: ultimo.misma_zona,
			creado_en: ultimo.creado_en
		};
	}
}
