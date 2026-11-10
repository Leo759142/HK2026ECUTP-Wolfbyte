import { describe, it, expect, beforeEach } from 'vitest';
import { reiniciarStore, store } from '../_store';
import { hashPin, verificarPin } from '../../../seguridad/pin';

function cookiesDe(sesion: { usuarioId: string; rol: string } | null) {
	if (!sesion) return { get: () => undefined };
	const valor = encodeURIComponent(JSON.stringify({ ...sesion, exp: Date.now() + 24 * 60 * 60 * 1000 }));
	return { get: (nombre: string) => (nombre === 'pod_sesion' ? valor : undefined) };
}

function urlDe(path: string) {
	return new URL(`http://localhost${path}`);
}

describe('ISO 25010 — Seguridad RF01 (PIN y sesión)', () => {
	beforeEach(() => reiniciarStore());

	it('hashPin no guarda plaintext y verificarPin valida', async () => {
		const hash = await hashPin('1234');
		expect(hash).not.toBe('1234');
		expect(hash.startsWith('pbkdf2-v1:')).toBe(true);
		expect(await verificarPin('1234', hash)).toBe(true);
		expect(await verificarPin('0000', hash)).toBe(false);
	});

	it('Registro y login por PIN establecen cookies', async () => {
		const { POST } = await import('./auth/+server.ts');
		const r1 = await (POST as any)({
			request: new Request('http://localhost/api/v1/auth/registro', {
				method: 'POST',
				headers: { 'content-type': 'application/json', 'idempotency-key': 'reg-001' },
				body: JSON.stringify({ celular: '999111222', alias: 'rosa', pin: '1234' })
			}),
			cookies: cookiesDe(null),
			url: urlDe('/api/v1/auth/registro')
		});
		expect(r1.status).toBe(201);

		const r2 = await (POST as any)({
			request: new Request('http://localhost/api/v1/auth/sesion', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ celular: '999111222', pin: '1234' })
			}),
			cookies: cookiesDe(null),
			url: urlDe('/api/v1/auth/sesion')
		});
		expect(r2.status).toBe(200);
		const cookie = r2.headers.get('set-cookie') ?? '';
		expect(cookie).toContain('pod_sesion=');
		expect(cookie).toContain('pod_rol=');

		const { GET } = await import('./auth/+server.ts');
		const r3 = await (GET as any)({
			request: new Request('http://localhost/api/v1/auth/sesion', { headers: { cookie } }),
			url: urlDe('/api/v1/auth/sesion'),
			cookies: { get: () => cookie } as any
		});
		const cuerpo = await r3.json();
		expect(cuerpo.loggedIn).toBe(true);
	});

	it('Login con PIN incorrecto falla', async () => {
		const { POST } = await import('./auth/+server.ts');
		await (POST as any)({
			request: new Request('http://localhost/api/v1/auth/registro', {
				method: 'POST',
				headers: { 'content-type': 'application/json', 'idempotency-key': 'reg-002' },
				body: JSON.stringify({ celular: '999333444', alias: 'pepe', pin: '5678' })
			}),
			cookies: cookiesDe(null),
			url: urlDe('/api/v1/auth/registro')
		});
		const r = await (POST as any)({
			request: new Request('http://localhost/api/v1/auth/sesion', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ celular: '999333444', pin: '0000' })
			}),
			cookies: cookiesDe(null),
			url: urlDe('/api/v1/auth/sesion')
		});
		expect(r.status).toBe(401);
	});
});