/** Servicios de datos para la UI (Fase B).
 *  Reemplaza ServicioRepoLocal / FavorRepoLocal / etc. que persistían en _store.
 *  Usa la API de dao.ts (IndexedDB) con sesión HTTP real. */
export async function apiRequest(method, path, body) {
	const resp = await fetch(`/api/v1${path}`, {
		method,
		headers: { 'content-type': 'application/json' },
		credentials: 'include',
		body: body !== undefined ? JSON.stringify(body) : undefined
	});
	const status = resp.status;
	const text = await resp.text();
	if (!resp.ok) throw new Error(`API ${method} ${path} -> ${status}: ${text}`);
	return text ? JSON.parse(text) : null;
}

export const apiGet = (path, init) => apiRequest('GET', path, init);
export const apiPost = (path, body, init) => apiRequest('POST', path, body, init);
