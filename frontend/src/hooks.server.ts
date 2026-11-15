import { setLocale } from '$lib/i18n';

/** @type {import('@sveltejs/kit').Handle} */
export const handle = async ({ event, resolve }) => {
	const lang = event.cookies.get('idioma') ?? 'es';
	setLocale(lang);
	return resolve(event);
};
