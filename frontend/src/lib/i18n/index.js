import { init, register, t, locale, waitLocale } from 'svelte-i18n';
import { esIdiomaSoportado, idiomaPorDefecto } from './languages.js';

const modulosLocales = import.meta.glob('./locales/*.json');

for (const ruta in modulosLocales) {
	const match = ruta.match(/\.\/locales\/([^/]+)\.json$/);
	if (match) {
		register(match[1], modulosLocales[ruta]);
	}
}

init({
	fallbackLocale: idiomaPorDefecto(),
	initialLocale: idiomaPorDefecto()
});

export function setLocale(lang) {
	const normalizado = (lang ?? idiomaPorDefecto()).toLowerCase();
	if (!esIdiomaSoportado(normalizado)) {
		console.warn(`[i18n] Locale "${lang}" no registrado, usando fallback "${idiomaPorDefecto()}"`);
		locale.set(idiomaPorDefecto());
		return;
	}
	locale.set(normalizado);
}

export { t, locale, waitLocale };
