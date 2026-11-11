import { describe, it, expect } from 'vitest';

/** Cálculo de luminancia relativa según WCAG 2.2 (sRGB). */
function luminanciaRelativa(r: number, g: number, b: number): number {
	const sRGB = [r, g, b].map((c) => {
		const s = c / 255;
		return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
	});
	return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

/** Ratio de contraste WCAG 2.2. */
function ratioContraste(color1: string, color2: string): number {
	const c1 = parseColor(color1);
	const c2 = parseColor(color2);
	const l1 = luminanciaRelativa(c1.r, c1.g, c1.b);
	const l2 = luminanciaRelativa(c2.r, c2.g, c2.b);
	const ligera = Math.max(l1, l2);
	const oscura = Math.min(l1, l2);
	return (ligera + 0.05) / (oscura + 0.05);
}

function parseColor(color: string): { r: number; g: number; b: number } {
	// hex #rrggbb
	const m = color.match(/^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/);
	if (m) {
		return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
	}
	// rgb(r, g, b)
	const m2 = color.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
	if (m2) {
		return { r: parseInt(m2[1], 10), g: parseInt(m2[2], 10), b: parseInt(m2[3], 10) };
	}
	// colores con nombre usados en app.css
	const nombres: Record<string, { r: number; g: number; b: number }> = {
		'#0f4c5c': { r: 15, g: 76, b: 92 }, // color-petroleo
		'#ffffff': { r: 255, g: 255, b: 255 },
		'#143d48': { r: 20, g: 61, b: 72 }, // color-tinta
		'#5b6870': { r: 91, g: 104, b: 112 }, // color-gris
		'#d7263d': { r: 215, g: 38, b: 61 }, // color-rojo
		'#f7f3ed': { r: 247, g: 243, b: 237 },
		'#fbf7f0': { r: 251, g: 247, b: 240 }, // color-crema
		'#7b2cbf': { r: 123, g: 44, b: 191 }, // color-morado
		'#a3142a': { r: 163, g: 20, b: 42 } // color-rojo-osc
	};
	if (nombres[color]) return nombres[color];
	return { r: 0, g: 0, b: 0 };
}

describe('RF25 — Contraste de color WCAG 2.2 AA', () => {
	it('texto blanco sobre petróleo cumple 4.5:1 (texto normal)', () => {
		const ratio = ratioContraste('#0f4c5c', '#ffffff');
		expect(ratio).toBeGreaterThanOrEqual(4.5);
	});

	it('texto blanco sobre morado cumple 4.5:1', () => {
		const ratio = ratioContraste('#7b2cbf', '#ffffff');
		expect(ratio).toBeGreaterThanOrEqual(4.5);
	});

	it('texto tinta sobre crema cumple 4.5:1', () => {
		const ratio = ratioContraste('#fbf7f0', '#143d48');
		expect(ratio).toBeGreaterThanOrEqual(4.5);
	});

	it('elementos gráficos (botones) cumplen 3:1 mínimo', () => {
		const ratio = ratioContraste('#0f4c5c', '#ffffff');
		expect(ratio).toBeGreaterThanOrEqual(3);
	});

	it('rojo sobre blanco cumple 3:1 para elementos gráficos', () => {
		const ratio = ratioContraste('#d7263d', '#ffffff');
		expect(ratio).toBeGreaterThanOrEqual(3);
	});

	it('gris sobre blanco no cumple 4.5:1 (debe evitarse en texto normal)', () => {
		const ratio = ratioContraste('#ffffff', '#aaaaaa');
		expect(ratio).toBeLessThan(4.5);
	});

	it('cálculo de luminancia relativa está en rango [0,1]', () => {
		const negro = luminanciaRelativa(0, 0, 0);
		const blanco = luminanciaRelativa(255, 255, 255);
		expect(negro).toBe(0);
		expect(blanco).toBeGreaterThan(0.9);
		expect(blanco).toBeLessThanOrEqual(1);
	});
});
