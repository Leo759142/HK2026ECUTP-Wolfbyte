/* Capa de compatibilidad con el sistema casero anterior.
 * Re-exporta las primitives de svelte-i18n y mantiene `translate` / `DICT`
 * para cualquier código legacy que aún las importe. */
import { t as _t, locale as _locale, setLocale as _setLocale } from './i18n/index.js';

/** Diccionario plano legado (clave plano → texto en ES). Se mantiene para referencia. */
export const DICT = {
	es: {
		'emergencia.titulo': 'TABLERO DE AYUDA HUMANITARIA',
		'emergencia.subtitulo': 'Recursos críticos disponibles en tu manzana',
		'emergencia.alerta_vacio': 'No hay alertas críticas reportadas en este sector.',
		'favor.estado.abierto': 'Abierto',
		'favor.estado.acordado': 'Ayuda en camino',
		'favor.estado.cerrado': 'Cerrado y confirmado',
		'favor.boton.cumplido': 'Confirmar Intercambio ("Se cumplió")',
		'offline.pendiente': 'Pendiente de enviar (Guardado en dispositivo)',
		'offline.enviado': 'Enviada con éxito al vecindario',
		'error.generico': 'Algo salió mal. El mensaje te indicará cómo corregirlo.',
		'error.permiso': 'Tu rol actual no tiene autorización para esta acción.',
		'nav.inicio': 'Inicio',
		'nav.favores': 'Favores',
		'nav.mapa': 'Mapa',
		'nav.yo': 'Yo',
		'nav.ahora': 'Ahora',
		'nav.grupos': 'Grupos',
		'nav.publicar': 'Publicar',
		hola: '¡Hola',
		lema: 'Hoy por ti, mañana por mí',
		buscar: '¿Qué necesitas hoy?',
		oficios: 'Oficios del barrio',
		recomendados: 'Los más recomendados',
		crearCuenta: 'Crear cuenta',
		yaTengo: 'Ya tengo cuenta',
		favores: 'Cadena de Favores',
		favoresSub: 'Sin dinero, entre vecinos',
		reportar: '¿Pasa algo grave? Reportar emergencia',
		misPublicaciones: 'Mis publicaciones',
		idioma: 'Idioma y lectura',
		enLinea: 'En línea',
		sinConexion: 'Sin conexión · Ahorrando datos. Ves lo último guardado.'
	},
	en: {
		'emergencia.titulo': 'HUMANITARIAN AID BOARD',
		'emergencia.subtitulo': 'Critical resources available in your block',
		'emergencia.alerta_vacio': 'There are no critical alerts reported in this sector.',
		'favor.estado.abierto': 'Open',
		'favor.estado.acordado': 'Help on the way',
		'favor.estado.cerrado': 'Closed and confirmed',
		'favor.boton.cumplido': 'Confirm Exchange ("Done")',
		'offline.pendiente': 'Pending to send (Saved on device)',
		'offline.enviado': 'Sent successfully to the neighborhood',
		'error.generico': 'Something went wrong. The message will tell you how to fix it.',
		'error.permiso': 'Your current role is not authorized for this action.',
		'nav.inicio': 'Home',
		'nav.favores': 'Favors',
		'nav.mapa': 'Map',
		'nav.yo': 'Me',
		'nav.ahora': 'Now',
		'nav.grupos': 'Groups',
		'nav.publicar': 'Post',
		hola: 'Hi',
		lema: 'Today for you, tomorrow for me',
		buscar: 'What do you need today?',
		oficios: 'Neighborhood trades',
		recomendados: 'Most recommended',
		crearCuenta: 'Create account',
		yaTengo: 'I already have an account',
		favores: 'Chain of Favors',
		favoresSub: 'No money, between neighbors',
		reportar: 'Something serious? Report an emergency',
		misPublicaciones: 'My posts',
		idioma: 'Language & reading',
		enLinea: 'Online',
		sinConexion: 'Offline · Saving data. You are seeing the last saved info.'
	},
	qu: {
		hola: '¡Allinllachu'
	}
};

/** Función de traducción legado: busca en DICT[lang][key] con fallback a ES. */
export function translate(lang, key) {
	return DICT[lang]?.[key] ?? DICT.es[key] ?? key;
}

export const IDIOMAS = [
	{ id: 'es', label: 'Español' },
	{ id: 'en', label: 'English' },
	{ id: 'qu', label: 'Runasimi (quechua)' }
];

export { _t as t, _locale as locale, _setLocale as setLocale };
