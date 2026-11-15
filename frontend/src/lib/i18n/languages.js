/**
 * Fuente única de metadatos de idiomas soportados.
 * Agregar un idioma nuevo = crear locales/xx.json + una entrada aquí.
 * labelNativo: nombre del idioma en sí mismo (no traducido), estable entre idiomas.
 * draft: si es true, se muestra aviso de "en preparación".
 */
export const IDIOMAS = [
	{ id: 'es', labelNativo: 'Español', draft: false },
	{ id: 'en', labelNativo: 'English', draft: false },
	{ id: 'qu', labelNativo: 'Runasimi', draft: true },
];

export const IDIOMAS_POR_ID = Object.fromEntries(IDIOMAS.map((l) => [l.id, l]));

export function obtenerIdioma(id) {
	return IDIOMAS_POR_ID[id] ?? { id, labelNativo: id, draft: false };
}

export function esIdiomaSoportado(id) {
	return id in IDIOMAS_POR_ID;
}

export function idiomaPorDefecto() {
	return 'es';
}
