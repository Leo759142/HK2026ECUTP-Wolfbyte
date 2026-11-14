import { createHash, randomBytes } from 'node:crypto';

/**
 * UUID estable a partir de un nombre (estilo UUID v5, SHA-1).
 * Se usa para los datos de demostración: el mismo nombre ("u-rosa") da siempre el mismo id.
 */
export function uuidDe(nombre: string): string {
	const h = createHash('sha1').update(`ayni:${nombre}`).digest();
	h[6] = (h[6] & 0x0f) | 0x50;
	h[8] = (h[8] & 0x3f) | 0x80;
	const x = h.subarray(0, 16).toString('hex');
	return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20, 32)}`;
}

/** Token opaco para sesiones (256 bits, base64url). */
export const nuevoToken = (): string => randomBytes(32).toString('base64url');

export const sha256 = (texto: string): string => createHash('sha256').update(texto).digest('hex');
