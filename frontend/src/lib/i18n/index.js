import { init, register, t, locale, setLocale as setLocaleStore } from 'svelte-i18n';
import { esIdiomaSoportado, idiomaPorDefecto } from './languages.js';

register('es', () => import('./locales/es.json'));
register('en', () => import('./locales/en.json'));
register('qu', () => import('./locales/qu.json'));

init({
	fallbackLocale: 'es',
	initialLocale: 'es'
});

/**
 * Establece el locale solo si está registrado; si no, cae al fallback.
 * Normaliza a minúsculas antes de aplicar.
 */
export function setLocale(lang) {
	const normalizado = (lang ?? idiomaPorDefecto()).toLowerCase();
	if (!esIdiomaSoportado(normalizado)) {
		console.warn(`[i18n] Locale "${lang}" no registrado, usando fallback "${idiomaPorDefecto()}"`);
		setLocaleStore(idiomaPorDefecto());
		return;
	}
	setLocaleStore(normalizado);
}

export { t, locale };
