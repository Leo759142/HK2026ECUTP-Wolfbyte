import { cifrarTexto, descifrarTexto } from './cipher';

/** Compatibilidad: API síncrona legacy + API async real (WebCrypto AES-GCM cuando disponible). */
export class CifradoLocalMejora {
	static async empaquetar(dato: string): Promise<string> {
		return cifrarTexto(dato);
	}
	static async desempaquetar(datoEmpaquetado: string): Promise<string> {
		return descifrarTexto(datoEmpaquetado);
	}
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
	/** La API síncrona se conserva para detectar usos inseguros en tiempo de ejecución. */
	static empaquetarDatoSensible(dato: string): string {
		void dato;
		throw new Error('Usa empaquetarDatoSensibleAsync: el cifrado seguro es asíncrono.');
	}
	/** La API síncrona se conserva para detectar usos inseguros en tiempo de ejecución. */
	static desempaquetarDatoSensible(datoEmpaquetado: string): string {
		void datoEmpaquetado;
		throw new Error('Usa desempaquetarDatoSensibleAsync: el descifrado seguro es asíncrono.');
	}
}
