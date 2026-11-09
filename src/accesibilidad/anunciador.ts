export type PrioridadAnuncio = 'polite' | 'assertive';

export class AnunciadorAccesible {
	private contenedorLive: HTMLElement | null = null;

	constructor() {
		// Inicializa el contenedor oculto en el DOM solo si estamos en un entorno de navegador válido
		if (typeof document !== 'undefined') {
			this.asegurarContenedor();
		}
	}

	/**
	 * Crea o localiza un área fuera de la pantalla configurada con aria-live.
	 * "polite": Espera a que el lector termine de hablar (Ideal para avisos de sincronización offline).
	 * "assertive": Interrumpe inmediatamente al usuario (Exclusivo para la activación del Modo Emergencia).
	 */
	private asegurarContenedor(): void {
		let el = document.getElementById('anunciador-comunitario-live');
		if (!el) {
			el = document.createElement('div');
			el.id = 'anunciador-comunitario-live';
			el.style.position = 'absolute';
			el.style.width = '1px';
			el.style.height = '1px';
			el.style.padding = '0';
			el.style.margin = '-1px';
			el.style.overflow = 'hidden';
			el.style.clip = 'rect(0, 0, 0, 0)';
			el.style.whiteSpace = 'nowrap';
			el.style.border = '0';
			document.body.appendChild(el);
		}
		this.contenedorLive = el;
	}

	/**
	 * Despacha el mensaje textual directo hacia el sintetizador de voz del dispositivo.
	 */
	vocalizar(mensaje: string, prioridad: PrioridadAnuncio = 'polite'): void {
		if (typeof document === 'undefined') return;
		if (!this.contenedorLive) this.asegurarContenedor();
		if (!this.contenedorLive) return;

		// Configura la urgencia de lectura requerida
		this.contenedorLive.setAttribute('aria-live', prioridad);
		this.contenedorLive.setAttribute('aria-atomic', 'true');

		// Limpiar el contenido previo y forzar el refresco de texto para activar el disparador del software de accesibilidad
		this.contenedorLive.textContent = '';
		queueMicrotask(() => {
			if (this.contenedorLive) {
				this.contenedorLive.textContent = mensaje;
			}
		});
	}
}
