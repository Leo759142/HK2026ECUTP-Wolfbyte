import { cifrarTexto, descifrarTexto } from './cipher';

/** Compatibilidad: API síncrona legacy + API async real (WebCrypto AES-GCM cuando disponible). */
export class CifradoLocalMejora {
	/**
	 * Cifrado real asíncrono con WebCrypto AES-GCM. Preferir sobre los métodos síncronos legacy.
	 */
	static async empaquetarDatoSensibleAsync(dato: string): Promise<string> {
		return cifrarTexto(dato);
	}
	/**
	 * Descifrado real asíncrono con WebCrypto AES-GCM.
	 */
	static async desempaquetarDatoSensibleAsync(datoEmpaquetado: string): Promise<string> {
		return descifrarTexto(datoEmpaquetado);
	}
	/** Legacy sync: solo ofuscación base64, no cifrado real. Usar `empaquetarDatoSensibleAsync` en producción. */
	static empaquetarDatoSensible(dato: string): string {
		if (globalThis.crypto?.subtle) return `pending-v1:${btoa(unescape(encodeURIComponent(dato)))}`;
		return dato;
	}
	/** Legacy sync: revierte ofuscación base64. Usar `desempaquetarDatoSensibleAsync` en producción. */
	static desempaquetarDatoSensible(datoEmpaquetado: string): string {
		if (datoEmpaquetado.startsWith('pending-v1:')) {
			try {
				return decodeURIComponent(escape(atob(datoEmpaquetado.slice('pending-v1:'.length))));
			} catch {
				return datoEmpaquetado;
			}
		}
		if (datoEmpaquetado.startsWith('plain:')) return datoEmpaquetado.slice(6);
		return datoEmpaquetado;
	}
}
