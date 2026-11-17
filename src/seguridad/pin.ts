/**
 * Cifrado real para PIN/contraseñas usando Web Crypto (PBKDF2).
 * Nunca almacena plaintext: guarda salt + hash derivado.
 * Compatible con Node (server) y navegador (client).
 */

const ITERACIONES = 600_000; // Recomendación actual de OWASP para SHA-256
const SALT_BYTES = 16;
const HASH_BITS = 256;
const HASH_ALG = 'SHA-256';

function bytesToB64(bytes: Uint8Array): string {
	let s = '';
	for (const b of bytes) s += String.fromCharCode(b);
	return btoa(s);
}

function b64ToBytes(b64: string): Uint8Array {
	const bin = atob(b64);
	const out = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
	return out;
}

function generarSalt(): Uint8Array {
	return crypto.getRandomValues(new Uint8Array(SALT_BYTES));
}

async function derivarHash(pin: string, salt: Uint8Array): Promise<string> {
	const enc = new TextEncoder();
	const claveBase = await crypto.subtle.importKey(
		'raw',
		enc.encode(pin),
		'PBKDF2',
		false,
		['deriveBits']
	);

	// deriveBits obtiene directamente los bytes sin crear una clave AES intermedia
    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt.buffer as ArrayBuffer,
            iterations: ITERACIONES,
            hash: HASH_ALG
        },
        claveBase,
        HASH_BITS
    );


	return bytesToB64(new Uint8Array(derivedBits));
}

export async function hashPin(pin: string): Promise<string> {
	const salt = generarSalt();
	const saltB64 = bytesToB64(salt);
	const hashB64 = await derivarHash(pin, salt);
	return `pbkdf2-v1:${saltB64}:${hashB64}`;
}

export async function verificarPin(pin: string, almacenado: string): Promise<boolean> {
	if (!almacenado.startsWith('pbkdf2-v1:')) {
		return false;
	}
	const partes = almacenado.split(':');
	const saltB64 = partes[1];
	const hashB64 = partes[2];
	if (!saltB64 || !hashB64) return false;

	try {
		const salt = b64ToBytes(saltB64);
		const calculadoB64 = await derivarHash(pin, salt);
		return comparacionConstante(calculadoB64, hashB64);
	} catch {
		// Captura errores si el Base64 almacenado está corrupto
		return false;
	}
}

function comparacionConstante(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let diferente = 0;
	for (let i = 0; i < a.length; i++) {
		diferente |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return diferente === 0;
}

export interface SesionPin {
	usuarioId: string;
	creadoEn: number;
	expiraEn: number;
}

export function crearSesionPin(usuarioId: string, ttlMs = 24 * 60 * 60 * 1000): SesionPin {
	const ahora = Date.now();
	return {
		usuarioId,
		creadoEn: ahora,
		expiraEn: ahora + ttlMs
	};
}

export function sesionValida(sesion: SesionPin | null): boolean {
	if (!sesion) return false;
	return Date.now() < sesion.expiraEn;
}
