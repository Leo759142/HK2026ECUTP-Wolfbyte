import { cifrarTexto, descifrarTexto } from './cipher';

/** Compatibilidad: API síncrona legacy + API async real (WebCrypto AES-GCM cuando disponible). */
export class CifradoLocalMejora {
	static async empaquetar(dato: string): Promise<string> {
		return cifrarTexto(dato);
	}
	static async desempaquetar(datoEmpaquetado: string): Promise<string> {
		return descifrarTexto(datoEmpaquetado);
	}
	static empaquetarDatoSensible(dato: string): string {
		// Legacy sync: si hay WebCrypto no podemos cifrar sync; marcamos para migración async.
		if (globalThis.crypto?.subtle) return `pending-v1:${btoa(unescape(encodeURIComponent(dato)))}`;
		return dato;
	}
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
