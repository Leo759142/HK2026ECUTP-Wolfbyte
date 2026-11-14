/* Cliente HTTP de la API AYNI (backend SvelteKit, contrato en backend/static/api/openapi.yaml).
 * - La sesión viaja en una cookie httpOnly que pone el servidor: aquí no se guarda ningún token.
 * - Los errores llegan como { codigo, mensaje } (texto listo para mostrar al vecino). */

const BASE = `${(import.meta.env?.VITE_API_URL ?? '').replace(/\/$/, '')}/api/v1`;

export class ErrorApi extends Error {
  constructor(status, codigo, mensaje) {
    super(mensaje);
    this.status = status;
    this.codigo = codigo;
  }
  /** Sin respuesta del servidor (sin señal, servidor caído): conviene reintentar. */
  get esDeRed() {
    return this.status === 0;
  }
  get esReintentable() {
    return this.status === 0 || this.status >= 500 || this.status === 429;
  }
}

export async function api(metodo, ruta, body, { timeoutMs = 15000 } = {}) {
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
  let res;
  try {
    res = await fetch(`${BASE}${ruta}`, {
      method: metodo,
      credentials: 'include',
      headers: body === undefined ? {} : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctrl?.signal,
    });
  } catch {
    throw new ErrorApi(0, 'SIN_CONEXION', 'No hay conexión con el servidor. Lo intentaremos de nuevo.');
  } finally {
    if (timer) clearTimeout(timer);
  }
  if (res.status === 204) return null;
  const texto = await res.text();
  let data = null;
  try {
    data = texto ? JSON.parse(texto) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    throw new ErrorApi(res.status, data?.codigo ?? `HTTP_${res.status}`, data?.mensaje ?? 'Algo salió mal. Inténtalo otra vez.');
  }
  return data;
}

export const get = (ruta) => api('GET', ruta);
export const post = (ruta, body) => api('POST', ruta, body ?? {});
