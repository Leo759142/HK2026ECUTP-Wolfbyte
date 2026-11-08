import type { RolEnFavor } from '../dominio/tipos/tipos';

export interface FavorVista {
	id: string;
	titulo: string;
	descripcion: string;
	estado: string;
	creador_id: string;
	ayudante_id: string | null;
}

/** Qué puede hacer la UI con un favor según su estado. */
export function accionesCierre(f: Pick<FavorVista, 'estado' | 'ayudante_id'>): 'confirmar' | 'esperando_ayudante' | 'cerrado' | 'ninguna' {
	if (f.estado === 'cerrado') return 'cerrado';
	if (f.estado === 'en_curso' && f.ayudante_id) return 'confirmar';
	if (f.estado === 'abierto') return 'esperando_ayudante';
	return 'ninguna';
}

/** Arma la llamada "Se cumplió" para el rol indicado, usando el usuario que corresponde a ese rol en el favor. */
export function construirConfirmacion(f: Pick<FavorVista, 'id' | 'creador_id' | 'ayudante_id'>, rol: RolEnFavor, idempotencyKey: string) {
	const usuario_id = rol === 'solicitante' ? f.creador_id : f.ayudante_id;
	return {
		url: `/api/v1/favores/${encodeURIComponent(f.id)}/confirmaciones`,
		init: {
			method: 'POST',
			headers: { 'content-type': 'application/json', 'Idempotency-Key': idempotencyKey },
			body: JSON.stringify({ rol_en_favor: rol, metodo: 'boton', usuario_id })
		} satisfies RequestInit
	};
}
