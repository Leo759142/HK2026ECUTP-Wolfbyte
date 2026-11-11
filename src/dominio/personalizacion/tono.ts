export type AdjetivoTono = 'cercano' | 'respetuoso' | 'energico' | 'neutro';

export interface PerfilTono {
	id: AdjetivoTono;
	adjetivo: string;
	emoji?: string;
	prefijo?: string;
	sufijo?: string;
	mayusculas?: boolean;
}

export const TONES_POR_DEFECTO: Record<AdjetivoTono, PerfilTono> = {
	cercano: {
		id: 'cercano',
		adjetivo: 'cercano',
		emoji: '🤝',
		prefijo: '¡',
		sufijo: ' vecino'
	},
	respetuoso: {
		id: 'respetuoso',
		adjetivo: 'respetuoso',
		prefijo: 'Estimado',
		sufijo: ''
	},
	energico: {
		id: 'energico',
		adjetivo: 'energico',
		emoji: '⚡',
		sufijo: ' ¡ya!',
		mayusculas: true
	},
	neutro: {
		id: 'neutro',
		adjetivo: 'neutro'
	}
};

export interface PreferenciaPersonalizacion {
	usuarioId: string;
	tono: AdjetivoTono;
	escala: number;
}

export function tonoPorDefecto(): PreferenciaPersonalizacion {
	return { usuarioId: '', tono: 'neutro', escala: 0 };
}

export function estaHabilitado(escala: number): boolean {
	return escala > 0 && escala <= 1;
}
