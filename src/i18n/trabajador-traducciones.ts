/**
 * Web Worker para carga asíncrona de diccionarios de traducción.
 *
 * Permite cargar archivos de idioma sin bloquear el hilo principal,
 * útil cuando el diccionario crece (muchos idiomas, muchas claves).
 * Se comunica mediante postMessage / onmessage.
 */

import type { Idioma } from '../dominio/tipos/tipos';

type MensajeWorker = {
	tipo: 'cargar';
	idioma: string;
} | {
	tipo: 'cargarVarios';
	idiomas: string[];
} | {
	tipo: 'obtener';
	idioma: string;
	clave: string;
};

type RespuestaWorker = {
	tipo: 'diccionario';
	idioma: string;
	datos: Record<string, string>;
} | {
	tipo: 'error';
	idioma: string;
	mensaje: string;
} | {
	tipo: 'traduccion';
	idioma: string;
	clave: string;
	valor: string;
};

// Diccionarios en memoria del worker
const diccionarios: Record<string, Record<string, string>> = {};

// Función simulada de carga remota (en producción podría ser fetch a /assets/i18n/<idioma>.json)
async function cargarDiccionarioRemoto(idioma: string): Promise<Record<string, string>> {
	// Intento 1: archivo JSON estático
	try {
		const respuesta = await fetch(`/assets/i18n/${idioma}.json`);
		if (respuesta.ok) {
			return (await respuesta.json()) as Record<string, string>;
		}
	} catch {
		// Ignorar, continuar al fallback
	}

	// Intento 2: fallback al módulo local (import dinámico)
	try {
		const modulo = await import(`../i18n/index.ts`);
		return modulo.DICCIONARIO_LOCAL[idioma as Idioma] ?? modulo;
	} catch {
		// No hay diccionario para este idioma
	}

	return {};
}

self.onmessage = async (event: MessageEvent<MensajeWorker>) => {
	const { tipo } = event.data;

	if (tipo === 'cargar') {
		const { idioma } = event.data;
		try {
			const datos = await cargarDiccionarioRemoto(idioma);
			diccionarios[idioma] = datos;
			self.postMessage({ tipo: 'diccionario', idioma, datos } as RespuestaWorker);
		} catch (error) {
			self.postMessage({
				tipo: 'error',
				idioma,
				mensaje: error instanceof Error ? error.message : 'Error cargando diccionario'
			} as RespuestaWorker);
		}
	}

	if (tipo === 'cargarVarios') {
		const { idiomas } = event.data;
		for (const idioma of idiomas) {
			if (diccionarios[idioma]) continue;
			try {
				const datos = await cargarDiccionarioRemoto(idioma);
				diccionarios[idioma] = datos;
				self.postMessage({ tipo: 'diccionario', idioma, datos } as RespuestaWorker);
			} catch (error) {
				self.postMessage({
					tipo: 'error',
					idioma,
					mensaje: error instanceof Error ? error.message : 'Error cargando diccionario'
				} as RespuestaWorker);
			}
		}
	}

	if (tipo === 'obtener') {
		const { idioma, clave } = event.data;
		const datos = diccionarios[idioma];
		const valor = datos?.[clave] ?? clave;
		self.postMessage({ tipo: 'traduccion', idioma, clave, valor } as RespuestaWorker);
	}
};