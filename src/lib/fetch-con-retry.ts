/**
 * Fetch con retry exponencial (fiabilidad ISO/IEC 25010).
 * Reintenta peticiones fallidas de red con backoff.
 */

export type RetryOptions = {
	reintentos?: number;
	retardoInicialMs?: number;
	reintentarSi?: (status: number) => boolean;
};

const DEFAULT_OPTIONS: Required<RetryOptions> = {
	reintentos: 3,
	retardoInicialMs: 500,
	reintentarSi: (status) => status >= 500 || status === 429
};

async function dormir(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchConRetry(
	entrada: RequestInfo | URL,
	init?: RequestInit,
	opciones: RetryOptions = {}
): Promise<Response> {
	const o = { ...DEFAULT_OPTIONS, ...opciones };
	let ultimoError: Error | null = null;
	let status = 0;

	for (let i = 0; i <= o.reintentos; i++) {
		try {
			const respuesta = await fetch(entrada, init);
			status = respuesta.status;
			if (respuesta.ok || !o.reintentarSi(status)) return respuesta;
			ultimoError = new Error(`HTTP ${status}`);
		} catch (cause) {
			ultimoError = cause instanceof Error ? cause : new Error(String(cause));
		}
		if (i < o.reintentos) await dormir(o.retardoInicialMs * 2 ** i);
	}

	throw ultimoError ?? new Error(`Fetch falló tras ${o.reintentos + 1} intentos (status ${status})`);
}
