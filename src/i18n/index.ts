import type { Idioma } from '../dominio/tipos/tipos';
import { IDIOMAS } from '../dominio/tipos/tipos';

export { IDIOMAS };
export type { Idioma };

export const DICCIONARIO_LOCAL: Record<Idioma, Record<string, string>> = {
	es: {
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
		sinConexion: 'Sin conexión · Ahorrando datos. Ves lo último guardado.',
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
		'error.permiso': 'Tu rol actual no tiene autorización para esta acción.'
	},
	en: {
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
		sinConexion: 'Offline · Saving data. You are seeing the last saved info.',
		'emergencia.titulo': 'HUMANITARIAN AID BOARD',
		'emergencia.subtitulo': 'Critical resources available in your block',
		'emergencia.alerta_vacio': 'No critical alerts reported in this sector.',
		'favor.estado.abierto': 'Open',
		'favor.estado.acordado': 'Help on the way',
		'favor.estado.cerrado': 'Closed and confirmed',
		'favor.boton.cumplido': 'Confirm Exchange ("Completed")',
		'offline.pendiente': 'Pending to send (Saved on device)',
		'offline.enviado': 'Successfully sent to the neighborhood',
		'error.generico': 'Something went wrong. The message will tell you how to fix it.',
		'error.permiso': 'Your current role is not authorized for this action.'
	},
	qu: {
		hola: '¡Allinllachu',
		'emergencia.titulo': 'HUQ MUSYANA (EMERGENCIA)',
		'emergencia.subtitulo': 'Suministrokunata chay manzanapi kachkan',
		'emergencia.alerta_vacio': 'Manam kanchu alerts kay pacha.',
		'favor.estado.abierto': 'Kichasqa',
		'favor.estado.acordado': 'Yanapanapaq',
		'favor.estado.cerrado': 'Wichqasqa',
		'favor.boton.cumplido': 'Llamkkasqa (Wichqasqa)',
		'offline.pendiente': 'Ñawpaqta ruwanapaq',
		'offline.enviado': 'Enviarqa',
		'error.generico': 'Pantay kachkan',
		'error.permiso': 'Permisota manam kankichu.'
	}
};

export function translate(lang: Idioma, key: string): string {
	return DICCIONARIO_LOCAL[lang]?.[key] ?? DICCIONARIO_LOCAL.es[key] ?? key;
}

export class GestorIdiomas {
	private _idiomaActual: Idioma;

	constructor(idiomaInicial: Idioma = 'es') {
		this._idiomaActual = idiomaInicial;
	}

	get idiomaActual(): Idioma {
		return this._idiomaActual;
	}

	cambiarIdioma(nuevoIdioma: Idioma): void {
		this._idiomaActual = nuevoIdioma;
	}

	t(clave: string): string {
		const traduccion = DICCIONARIO_LOCAL[this._idiomaActual]?.[clave];
		if (!traduccion) {
			return DICCIONARIO_LOCAL['es']?.[clave] || clave;
		}
		return traduccion;
	}
}
