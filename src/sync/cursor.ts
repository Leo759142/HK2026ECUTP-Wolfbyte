// src/lib/sync/cursor.ts

export class CursorSincronizacion {
	private readonly LLAVE_CURSOR = 'comunidad_sincronizacion_cursor';

	/**
	 * Obtiene la fecha límite de la última descarga exitosa registrada en el cliente.
	 * Retorna una fecha base antigua (Epoch) si es la primera sincronización.
	 */
	obtenerUltimoTimestamp(): string {
		if (typeof window !== 'undefined') {
			return localStorage.getItem(this.LLAVE_CURSOR) || new Date(0).toISOString();
		}
		return new Date(0).toISOString();
	}

	/**
	 * Actualiza el cursor tras procesar un lote descendente de datos nuevos enviado por la API.
	 */
	actualizarCursor(nuevaFechaIso: string): void {
		if (typeof window !== 'undefined') {
			localStorage.setItem(this.LLAVE_CURSOR, nuevaFechaIso);
		}
	}

	/**
	 * Limpia los punteros locales en caso de un cierre de sesión forzado.
	 */
	reiniciar(): void {
		if (typeof window !== 'undefined') {
			localStorage.removeItem(this.LLAVE_CURSOR);
		}
	}
}
