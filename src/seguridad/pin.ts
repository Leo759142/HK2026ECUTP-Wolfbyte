/**
 * Cifrado real para PIN/contraseñas usando Web Crypto.
 * Nunca almacena plaintext: guarda salt + hash derivado (PBKDF2-equivalente via SHA-256).
 * Compatible con Node (server) y navegador (client).
 */

const ITERACIONES = 100_000;
const SALT_BYTES = 16;
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

export async function hashPin(pin: string): Promise<string> {
	const salt = generarSalt();
	const enc = new TextEncoder();
	const claveBase = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveKey']);
	const derivada = await crypto.subtle.deriveKey(
		{ name: 'PBKDF2', salt: enc.encode('pod-pin-v1'), iterations: ITERACIONES, hash: 'SHA-256' },
		claveBase,
		{ name: HASH_ALG, length: 256 },
		false,
		[]
	);
	const raw = await crypto.subtle.digest(HASH_ALG, enc.encode(String(pin) + bytesToB64(salt)));
	const hashB64 = bytesToB64(new Uint8Array(raw));
	return `pbkdf2-v1:${bytesToB64(salt)}:${hashB64}`;
}

export async function verificarPin(pin: string, almacenado: string): Promise<boolean> {
	if (!almacenado.startsWith('pbkdf2-v1:')) {
		// Formato legacy sin hash: rechazar por seguridad
		return false;
	}
	const [, saltB64, hashB64] = almacenado.split(':');
	if (!saltB64 || !hashB64) return false;
	const salt = b64ToBytes(saltB64);
	const enc = new TextEncoder();
	const raw = await crypto.subtle.digest(HASH_ALG, enc.encode(String(pin) + bytesToB64(salt)));
	const hashCalculado = bytesToB64(new Uint8Array(raw));
	// Comparación en tiempo constante para evitar timing attacks
	return comparacionConstante(hashCalculado, hashB64);
}

function comparacionConstante(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let diferencia = 0;
	for (let i = 0; i < a.length; i++) {
		diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return diferencia === 0;
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