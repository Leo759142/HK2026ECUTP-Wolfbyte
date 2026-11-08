export class GestorFocoVecinal {
	/**
	 * Captura el foco dentro de un contenedor (Modal o Alerta Activa), impidiendo que la navegación
	 * por teclado (Tab) se escape a elementos secundarios del fondo. Esencial para adultos mayores.
	 */
	static atraparFoco(contenedor: HTMLElement): () => void {
		const elementosInteractivos = contenedor.querySelectorAll<HTMLElement>(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		);

		if (elementosInteractivos.length === 0) return () => {};

		const primerElemento = elementosInteractivos[0];
		const ultimoElemento = elementosInteractivos[elementosInteractivos.length - 1];

		// Coloca el foco inmediatamente en el primer control interactivo (ej: Botón Cerrar o Confirmar)
		primerElemento.focus();

		const manejarTeclado = (evento: KeyboardEvent) => {
			if (evento.key !== 'Tab') return;

			if (evento.shiftKey) {
				if (document.activeElement === primerElemento) {
					ultimoElemento.focus();
					evento.preventDefault();
				}
			} else {
				if (document.activeElement === ultimoElemento) {
					primerElemento.focus();
					evento.preventDefault();
				}
			}
		};

		contenedor.addEventListener('keydown', manejarTeclado);

		// Retorna una función de limpieza (cleanup) para remover el escuchador cuando se destruya el componente
		return () => {
			contenedor.removeEventListener('keydown', manejarTeclado);
		};
	}
}
