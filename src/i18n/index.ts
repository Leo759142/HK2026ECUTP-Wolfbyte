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
		'error.permiso': 'Tu rol actual no tiene autorización para esta acción.',
		'tutorial.1.titulo': 'Hoy por ti,\nmañana por mí',
		'tutorial.1.texto': 'Encuentra gasfiteros, profes y más, recomendados por tus propios vecinos.',
		'tutorial.2.titulo': 'Pide o presta\nsin dinero',
		'tutorial.2.texto':
			'Presta tu escalera, regala lo que te sobra o intercambia lo que sabes hacer.',
		'tutorial.3.titulo': 'En emergencias,\nnos cuidamos',
		'tutorial.3.texto': 'Si pasa algo grave, AYNI cambia a modo emergencia para coordinar ayuda.',
		'access.crear': 'Crear cuenta',
		'access.ingresar': 'Ya tengo cuenta',
		'access.siguiente': 'Siguiente →',
		'access.empezar': 'Empezar',
		'access.continuar': 'Continuar',
		'access.entrar': 'Entrar a AYNI',
		'btn.confirmar': 'Confirmar',
		'btn.cancelar': 'Cancelar',
		'btn.guardar': 'Guardar',
		'btn.editar': 'Editar',
		'btn.eliminar': 'Eliminar',
		'btn.atras': 'Atrás',
		'btn.siguiente': 'Siguiente',
		'btn.verificar': 'Verificar',
		'btn.enviar': 'Enviar',
		'btn.registrar': 'Registrar',
		'btn.entrar': 'Entrar',
		'btn.crearCuenta': 'Crear cuenta',
		'btn.yaTengo': 'Ya tengo cuenta',
		'btn.reportarEmergencia': 'Reportar emergencia',
		'btn.publicar': 'Publicar',
		'btn.verMapa': 'Ver mapa'
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
		'error.permiso': 'Your current role is not authorized for this action.',
		'tutorial.1.titulo': 'Today for you,\ntomorrow for me',
		'tutorial.1.texto': 'Find tradespeople, teachers and more, recommended by your neighbors.',
		'tutorial.2.titulo': 'Ask or lend\nwithout money',
		'tutorial.2.texto': 'Lend your ladder, give away what you have or exchange what you know.',
		'tutorial.3.titulo': 'In emergencies,\nwe care for each other',
		'tutorial.3.texto': 'When something serious happens, AYNI coordinates community help.',
		'access.crear': 'Create account',
		'access.ingresar': 'I already have an account',
		'access.siguiente': 'Next →',
		'access.empezar': 'Start',
		'access.continuar': 'Continue',
		'access.entrar': 'Enter AYNI',
		'btn.confirmar': 'Confirm',
		'btn.cancelar': 'Cancel',
		'btn.guardar': 'Save',
		'btn.editar': 'Edit',
		'btn.eliminar': 'Delete',
		'btn.atras': 'Back',
		'btn.siguiente': 'Next',
		'btn.verificar': 'Verify',
		'btn.enviar': 'Send',
		'btn.registrar': 'Register',
		'btn.entrar': 'Enter',
		'btn.crearCuenta': 'Create account',
		'btn.yaTengo': 'I already have an account',
		'btn.reportarEmergencia': 'Report emergency',
		'btn.publicar': 'Post',
		'btn.verMapa': 'View map'
	},
	qu: {
		hola: '¡Allinllachu',
		'emergencia.titulo': 'MUSYANA (EMERGENCIA)',
		'emergencia.subtitulo': 'Suministrokunata chay manzanapi kachkan',
		'emergencia.alerta_vacio': 'Manam kanchu alerts kay pacha.',
		'favor.estado.abierto': 'Kichasqa',
		'favor.estado.acordado': 'Yanapanapaq',
		'favor.estado.cerrado': 'Wichqasqa',
		'favor.boton.cumplido': 'Llamkkasqa (Wichqasqa)',
		'offline.pendiente': 'Ñawpaqta ruwanapaq',
		'offline.enviado': 'Enviarqa',
		'error.generico': 'Pantay kachkan',
		'error.permiso': 'Permisota manam kankichu.',
		'tutorial.1.titulo': 'Kunan qanpaq,\npaqarin ñuqapaq',
		'tutorial.1.texto': 'Llaqtamasiykikunam qhawachisqankuna llamkayninkunata tariy.',
		'tutorial.2.titulo': 'Mańakuy utaq quykuy\nqullqillan',
		'tutorial.2.texto': 'Yachaykikunata rantinakuy utaq yanapay.',
		'tutorial.3.titulo': 'Sasachakuypi,\nukhunchik qhawakusun',
		'tutorial.3.texto': 'Hatun sasachakuy kaptin AYNI yanapakuyninta kamachin.',
		'access.crear': 'Cuenta ruray',
		'access.ingresar': 'Cuenta ñiyoq kani',
		'access.siguiente': 'Qatiy →',
		'access.empezar': 'Qallariy',
		'access.continuar': 'Qatiy',
		'access.entrar': 'AYNI-man yaykuy',
		'btn.confirmar': 'Llamkkasqa',
		'btn.cancelar': 'Munakunawan',
		'btn.guardar': 'Yuyasqa',
		'btn.editar': 'Utichiy',
		'btn.eliminar': 'Huchuy',
		'btn.atras': 'Ñawpaq',
		'btn.siguiente': 'Chawpi',
		'btn.verificar': 'Allichiy',
		'btn.enviar': 'Tusuq',
		'btn.registrar': 'Ruray',
		'btn.entrar': 'Yaykuy',
		'btn.crearCuenta': 'Cuenta ruray',
		'btn.yaTengo': 'Cuenta ñiyoq kani',
		'btn.reportarEmergencia': 'Musya qhawasqa',
		'btn.publicar': 'Llukchiy',
		'btn.verMapa': 'Papakuna riku'
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

// Re-exportar desde gestor.ts para mantener compatibilidad con el sistema mejorado
export {
	gestorIdiomas,
	traducir,
	GestorIdiomasMejorado,
	resolverIdiomaActual,
	obtenerIdiomaDesdeURL,
	normalizarIdioma,
	obtenerCodigoISO,
	obtenerCodigoGlottolog,
	obtenerNombreIdioma,
	IDIOMAS_DISPONIBLES,
	CODIGOS_ISO_639_3
} from './gestor';

export type { CodigoIdioma } from './codigos';
