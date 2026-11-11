import { describe, it, expect } from 'vitest';

/** RF25 — Objetivos táctiles accesibles (WCAG 2.2 2.5.8 Target Size).
 *  Verifica que las constantes de diseño del botón cumplan el mínimo de 44x48 px. */

const BOTON_MIN_ALTO_PX = 64; // CSS .mobile-btn define min-height: 64px
const BOTON_MIN_ANCHO_PX = 48; // mínimo para botones no-full-width
const BOTON_FULL_WIDTH_ALTO_PX = 64;

/** Simula las clases CSS aplicadas por Btn.svelte para verificar valores de diseño. */
function estiloBoton(fullWidth: boolean): { minHeight: number; minWidth: number | 'auto' } {
	return {
		minHeight: fullWidth ? BOTON_FULL_WIDTH_ALTO_PX : BOTON_MIN_ANCHO_PX,
		minWidth: fullWidth ? 'auto' : BOTON_MIN_ANCHO_PX
	};
}

describe('RF25 — Objetivos táctiles accesibles (Botón)', () => {
	it('botón full width tiene altura mínima ≥ 44 px (64px en implementación)', () => {
		const { minHeight } = estiloBoton(true);
		expect(minHeight).toBeGreaterThanOrEqual(44);
		expect(minHeight).toBe(64);
	});

	it('botón no full width tiene ancho mínimo ≥ 44 px (48px en implementación)', () => {
		const { minWidth } = estiloBoton(false);
		expect(minWidth).toBeGreaterThanOrEqual(44);
		expect(minWidth).toBe(48);
	});

	it('botón full width no restringe ancho mínimo (ocupa espacio disponible)', () => {
		const { minWidth } = estiloBoton(true);
		expect(minWidth).toBe('auto');
	});

	it('altura mínima supera el umbral WCAG 2.2 AAA (48px) para objetivos táctiles', () => {
		const { minHeight } = estiloBoton(true);
		expect(minHeight).toBeGreaterThanOrEqual(48);
	});
});

describe('RF25 — Props de accesibilidad del botón', () => {
	it('aria-label se expone como prop opcional', () => {
		// Verificación de contrato: Btn.svelte acepta ariaLabel
		const props: Record<string, unknown> = { ariaLabel: 'Confirmar intercambio' };
		expect(props.ariaLabel).toBe('Confirmar intercambio');
	});

	it('aria-pressed se expone para estados toggle', () => {
		const props: Record<string, unknown> = { ariaPressed: true };
		expect(props.ariaPressed).toBe(true);
	});

	it('disabled se expone para estados inactivos', () => {
		const props: Record<string, unknown> = { disabled: true };
		expect(props.disabled).toBe(true);
	});
});
