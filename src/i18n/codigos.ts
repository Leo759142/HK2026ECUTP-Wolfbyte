/**
 * Códigos de idioma para soporte escalable i18n.
 *
 * Estándares soportados:
 *  - ISO 639-3 (códigos de 3 letras + sufijo numérico opcional)
 *  - Glottolog (códigos de identificador de glotocódigo para referencia académica)
 *
 * Formato de clave de idioma: `<iso639-3><sufijo4digitos?>`
 * Ejemplos: 'spa0000', 'eng0000', 'qu0000'
 */

export type CodigoIdioma = 'es' | 'en' | 'qu' | 'spa0000' | 'eng0000' | 'qu0000';

/** Mapeo de códigos cortos (legado) a códigos ISO 639-3 extendidos */
export const CODIGOS_ISO_639_3: Record<string, string> = {
	es: 'spa',
	en: 'eng',
	qu: 'qu0',
	spa0000: 'spa',
	eng0000: 'eng',
	qu0000: 'qu0'
};

/** Mapeo de códigos cortos a nombres legibles de idioma */
export const NOMBRES_IDIOMA: Record<string, string> = {
	es: 'Español',
	en: 'English',
	qu: 'Qhapaq Simi (Quechua)',
	spa0000: 'Español',
	eng0000: 'English',
	qu0000: 'Qhapaq Simi (Quechua)'
};

/** Códigos Glottolog para referencia académica y escalabilidad futura */
export const CODIGOS_GLOTTOLOG: Record<string, string> = {
	es: 'stan1288', // Spanish (Castilian)
	en: 'stan1291', // English
	qu: 'cusc1238', // Quechua (Cusco)
	spa0000: 'stan1288',
	eng0000: 'stan1291',
	qu0000: 'cusc1238'
};

/** Lista de todos los idiomas soportados (cortos y extendidos) */
export const IDIOMAS_DISPONIBLES: CodigoIdioma[] = [
	'es',
	'en',
	'qu',
	'spa0000',
	'eng0000',
	'qu0000'
] as CodigoIdioma[];

/**
 * Normaliza un código de idioma entrante (desde URL ?lang= o localStorage)
 * a un código interno válido. Soporta tanto códigos cortos como ISO 639-3 extendidos.
 */
export function normalizarIdioma(codigo: string | null | undefined): CodigoIdioma {
	if (!codigo) return 'es';

	const c = codigo.toLowerCase().trim();

	// Si ya es un código válido corto o extendido, devolverlo
	if (IDIOMAS_DISPONIBLES.includes(c as CodigoIdioma)) {
		return c as CodigoIdioma;
	}

	// Mapeo de ISO 639-3 de 3 letras a código corto
	const isoParaCorto: Record<string, CodigoIdioma> = {
		spa: 'es',
		eng: 'en',
		qu0: 'qu',
		quz: 'qu'
	};

	if (isoParaCorto[c]) {
		return isoParaCorto[c];
	}

	// Fallback a español
	return 'es';
}

/**
 * Obtiene el código ISO 639-3 completo para un idioma dado.
 * Ejemplo: 'qu' -> 'qu0', 'qu0000' -> 'qu0'
 */
export function obtenerCodigoISO(idioma: CodigoIdioma | string): string {
	return CODIGOS_ISO_639_3[idioma] ?? 'spa';
}

/**
 * Obtiene el código Glottolog para un idioma dado (para uso académico/futuro).
 */
export function obtenerCodigoGlottolog(idioma: CodigoIdioma | string): string | null {
	return CODIGOS_GLOTTOLOG[idioma] ?? null;
}

/**
 * Obtiene el nombre legible del idioma.
 */
export function obtenerNombreIdioma(idioma: CodigoIdioma | string): string {
	return NOMBRES_IDIOMA[idioma] ?? idioma;
}