/** Utilidades para llamar handlers de +server.ts directamente desde Vitest. */
type Handler = (event: never) => Response | Promise<Response>;

export interface OpcionesLlamada {
	method?: 'GET' | 'POST';
	body?: unknown;
	headers?: Record<string, string>;
	params?: Record<string, string>;
	query?: Record<string, string>;
}

export async function llamar(handler: Handler, ruta: string, op: OpcionesLlamada = {}) {
	const url = new URL(`http://localhost${ruta}`);
	for (const [k, v] of Object.entries(op.query ?? {})) url.searchParams.set(k, v);
	const method = op.method ?? (op.body === undefined ? 'GET' : 'POST');
	const request = new Request(url, {
		method,
		headers: { 'content-type': 'application/json', ...(op.headers ?? {}) },
		body: op.body === undefined ? undefined : typeof op.body === 'string' ? op.body : JSON.stringify(op.body)
	});
	const res = await handler({ request, url, params: op.params ?? {} } as never);
	const texto = await res.text();
	let json: unknown = null;
	try {
		json = texto ? JSON.parse(texto) : null;
	} catch {
		json = texto;
	}
	return { status: res.status, headers: res.headers, json: json as Record<string, unknown> };
}

let n = 0;
/** Idempotency-Key única por llamada (>= 8 caracteres). */
export function clave(): string {
	n += 1;
	return `test-key-${Date.now()}-${n}`;
}
