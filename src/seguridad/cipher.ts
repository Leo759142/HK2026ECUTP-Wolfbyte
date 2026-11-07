const ALG = 'AES-GCM';
const IV_BYTES = 12;
const SALT = 'pod-local-v1';

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

async function deriveKey(secret: string): Promise<CryptoKey> {
	const enc = new TextEncoder();
	const base = await crypto.subtle.importKey('raw', enc.encode(secret), 'PBKDF2', false, ['deriveKey']);
	return crypto.subtle.deriveKey(
		{ name: 'PBKDF2', salt: enc.encode(SALT), iterations: 100_000, hash: 'SHA-256' },
		base,
		{ name: ALG, length: 256 },
		false,
		['encrypt', 'decrypt']
	);
}

function secretPorDefecto(): string {
	// En navegador: secreto de dispositivo efímero persistido localmente; en server/test: valor estable.
	if (typeof localStorage === 'undefined') return 'server-fallback-secret';
	let s = localStorage.getItem('pod:device-secret');
	if (!s) {
		s = bytesToB64(crypto.getRandomValues(new Uint8Array(32)));
		localStorage.setItem('pod:device-secret', s);
	}
	return s;
}

export async function cifrarTexto(plano: string, secret = secretPorDefecto()): Promise<string> {
	if (!globalThis.crypto?.subtle) return `plain:${plano}`;
	const key = await deriveKey(secret);
	const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
	const data = new TextEncoder().encode(plano);
	const ct = await crypto.subtle.encrypt({ name: ALG, iv }, key, data);
	return `v1:${bytesToB64(iv)}:${bytesToB64(new Uint8Array(ct))}`;
}

export async function descifrarTexto(empaquetado: string, secret = secretPorDefecto()): Promise<string> {
	if (empaquetado.startsWith('plain:')) return empaquetado.slice(6);
	if (!empaquetado.startsWith('v1:') || !globalThis.crypto?.subtle) return empaquetado;
	const [, ivB64, ctB64] = empaquetado.split(':');
	if (!ivB64 || !ctB64) return empaquetado;
	const key = await deriveKey(secret);
	const pt = await crypto.subtle.decrypt(
		{ name: ALG, iv: b64ToBytes(ivB64) as unknown as BufferSource },
		key,
		b64ToBytes(ctB64) as unknown as BufferSource
	);
	return new TextDecoder().decode(pt);
}
