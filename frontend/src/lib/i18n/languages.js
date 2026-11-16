export const IDIOMAS = [
	{ id: 'es', labelNativo: 'Español', draft: false },
	{ id: 'en', labelNativo: 'English', draft: false },
	{ id: 'qu', labelNativo: 'Runasimi', draft: true }
];

export const IDIOMAS_POR_ID = Object.fromEntries(IDIOMAS.map((l) => [l.id, l]));

export function obtenerIdioma(id) {
	return IDIOMAS_POR_ID[id] ?? { id, labelNativo: id, draft: false };
}

export function esIdiomaSoportado(id) {
	return typeof id === 'string' && Object.hasOwn(IDIOMAS_POR_ID, id);
}

export function idiomaPorDefecto() {
	return 'es';
}
