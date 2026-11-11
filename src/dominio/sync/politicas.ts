/**
 * Políticas de sincronización por entidad (RF18).
 * Define cómo se resuelven conflictos al sincronizar operaciones offline.
 */
import type { EstrategiaSync } from '../tipos/tipos';

export interface PoliticaSyncEntidad {
	entidad: string;
	estrategia: EstrategiaSync;
	nota: string;
}

/**
 * Políticas por defecto para cada entidad.
 * - append_only: solo INSERT, nunca UPDATE/DELETE (recomendaciones, reportes, confirmaciones)
 * - ultima_escritura: LWW por updated_at (servicios, favores edición)
 * - primero_gana: solo el primer writer gana (reservar favor)
 * - servidor_manda: el cliente no puede cambiar el estado (emergencias, moderación)
 */
export const POLITICAS_SYNC: PoliticaSyncEntidad[] = [
	{ entidad: 'recomendaciones', estrategia: 'append_only', nota: 'Vistos Buenos: solo se agregan' },
	{ entidad: 'recomendacion_etiquetas', estrategia: 'append_only', nota: 'Etiquetas: solo se agregan' },
	{ entidad: 'reportes', estrategia: 'append_only', nota: 'Reportes de moderación: solo se agregan' },
	{ entidad: 'favor_confirmaciones', estrategia: 'append_only', nota: 'Confirmaciones de favor: solo se agregan' },
	{ entidad: 'emergencia_confirmaciones', estrategia: 'append_only', nota: 'Confirmaciones de emergencia: solo se agregan' },
	{ entidad: 'servicios', estrategia: 'ultima_escritura', nota: 'Servicios: última escritura gana' },
	{ entidad: 'favores', estrategia: 'ultima_escritura', nota: 'Favores: última escritura gana' },
	{ entidad: 'reservar_favor', estrategia: 'primero_gana', nota: 'Reservar favor: gana el primero' },
	{ entidad: 'emergencias', estrategia: 'servidor_manda', nota: 'Emergencias: solo el coordinador decide' },
	{ entidad: 'moderacion', estrategia: 'servidor_manda', nota: 'Moderación: solo el referente decide' },
	{ entidad: 'anuncios', estrategia: 'servidor_manda', nota: 'Anuncios: solo el administrador decide' }
];

const MAPA_POLITICAS = new Map<string, PoliticaSyncEntidad>(
	POLITICAS_SYNC.map((p) => [p.entidad, p])
);

/** Obtiene la política de sync para una entidad. Si no existe, usa 'ultima_escritura' por defecto. */
export function obtenerPoliticaSync(entidad: string): PoliticaSyncEntidad {
	return (
		MAPA_POLITICAS.get(entidad) ?? {
			entidad,
			estrategia: 'ultima_escritura',
			nota: 'Política por defecto: última escritura gana'
		}
	);
}

/** Verdadero si la entidad solo permite append (nunca UPDATE/DELETE). */
export function esAppendOnly(entidad: string): boolean {
	return obtenerPoliticaSync(entidad).estrategia === 'append_only';
}

/** Verdadero si la entidad solo puede ser modificada por el servidor. */
export function esServidorManda(entidad: string): boolean {
	return obtenerPoliticaSync(entidad).estrategia === 'servidor_manda';
}