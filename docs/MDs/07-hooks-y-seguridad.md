# 07 · Hooks, sesión y seguridad del borde

> **Objetivo:** que ninguna petición llegue a una ruta sin pasar por identificación, autorización, límites y trazabilidad. `hooks.server.ts` es el único lugar donde viven esas reglas transversales.

---

## 1. Archivos y orden de ejecución

| Archivo | Corre en | Se ejecuta |
|---|---|---|
| `src/hooks.server.ts` | Servidor (y prerender) | En cada request, antes de resolver la ruta |
| `src/hooks.client.ts` | Navegador | En cada navegación y error de cliente |
| `src/hooks.ts` | Ambos | `reroute` y `transport` |

Flujo de una petición:

```text
Request
  → handle (server)
      → session
      → rate limit
      → RBAC
      → resolve(event)
          → load / action / endpoint
      → security headers
  → Response
```

Si `handle` devuelve una `Response` sin llamar a `resolve`, la ruta no se ejecuta (útil para mantenimiento, 401 o 429).

---

## 2. Tipado de `locals` y errores

```ts
// src/app.d.ts
declare global {
  namespace App {
    interface Locals {
      requestId: string;
      actor: {
        id: string;
        role: 'citizen' | 'operator' | 'supervisor' | 'admin';
        districtId: string | null;
        displayName: string;
      } | null;
      sessionId: string | null;
    }

    interface PageData {
      actor: App.Locals['actor'];
    }

    interface PageState {
      modal?: 'report' | 'filter' | null;
    }

    interface Error {
      code: string;
      requestId: string;
      message: string;
    }

    interface Platform {}
  }
}

export {};
```

Regla: `locals` solo contiene datos de request; nunca se serializa al cliente por accidente. Para exponer el actor a la UI, devolverlo explícitamente desde `+layout.server.ts`.

---

## 3. `handle` compuesto

```ts
// src/hooks.server.ts
import type { Handle, HandleServerError, ServerInit } from '@sveltejs/kit/hooks';
import { sequence } from '@sveltejs/kit/hooks';
import { json } from '@sveltejs/kit'; // solo si se usa; en v3 preferir Response.json
import { dev } from '$app/env';
import { verifySession } from '$lib/infra/server/session';
import { checkRateLimit } from '$lib/infra/server/rate-limit';
import { log } from '$lib/infra/server/logger';

const requestContext: Handle = async ({ event, resolve }) => {
  const requestId = event.request.headers.get('x-request-id') ?? crypto.randomUUID();
  event.locals.requestId = requestId;
  event.locals.actor = null;
  event.locals.sessionId = null;

  const started = performance.now();
  const response = await resolve(event);
  const durationMs = Math.round(performance.now() - started);

  response.headers.set('x-request-id', requestId);
  log.info(
    {
      requestId,
      method: event.request.method,
      route: event.route.id,
      status: response.status,
      durationMs,
      actorRole: event.locals.actor?.role ?? 'anonymous'
    },
    'request'
  );

  return response;
};

const session: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get('sid');
  if (token) {
    const result = await verifySession(token);
    if (result) {
      event.locals.actor = result.actor;
      event.locals.sessionId = result.sessionId;
    } else {
      event.cookies.delete('sid', { path: '/' });
    }
  }
  return resolve(event);
};

const rateLimit: Handle = async ({ event, resolve }) => {
  if (!event.url.pathname.startsWith('/api/')) return resolve(event);

  const key = `${event.getClientAddress()}:${event.locals.actor?.id ?? 'anon'}`;
  const limit = await checkRateLimit(key, event.request.method);
  if (!limit.ok) {
    return Response.json(
      {
        type: 'about:blank',
        title: 'Demasiadas solicitudes',
        status: 429,
        retryAfter: limit.retryAfter
      },
      {
        status: 429,
        headers: {
          'content-type': 'application/problem+json',
          'retry-after': String(limit.retryAfter),
          'ratelimit-limit': String(limit.limit),
          'ratelimit-remaining': '0'
        }
      }
    );
  }
  return resolve(event);
};

const maintenance: Handle = async ({ event, resolve }) => {
  if (dev) return resolve(event);
  if (event.url.pathname.startsWith('/api/health')) return resolve(event);
  // Flag en base de datos o variable de entorno
  if (process.env.MAINTENANCE_MODE === '1') {
    return new Response('Mantenimiento programado', {
      status: 503,
      headers: { 'retry-after': '3600' }
    });
  }
  return resolve(event);
};

export const handle = sequence(requestContext, session, rateLimit, maintenance);
```

Orden recomendado:

1. `requestContext` (ID y logging, siempre).
2. `session` (identidad).
3. `rateLimit` (depende de identidad para limitar por usuario).
4. `maintenance`.
5. Guards específicos de ruta en `+layout.server.ts` (no en `handle`, para no acoplar todo).

---

## 4. Sesión

### 4.1 Modelo

- **Cookie opaca:** `sid` con un identificador aleatorio de 32 bytes; no un JWT con datos.
- **Servidor:** tabla `sessions` con `id_hash`, `actor_id`, `created_at`, `expires_at`, `rotated_at`, `user_agent_hash`, `ip_hash`.
- **Expiración:** 30 días para "recordarme"; 12 horas para panel municipal.
- **Rotación:** al iniciar sesión y al elevar privilegios; invalidar la anterior.
- **Logout:** borrar cookie + fila de sesión.

```ts
// src/lib/infra/server/session.ts
import { randomBytes, createHash } from 'node:crypto';
import { db } from './db';
import { sessions, actors } from './schema';
import { eq, and, gt } from 'drizzle-orm';

const COOKIE = 'sid';
const MAX_AGE = 60 * 60 * 24 * 30;

export async function createSession(actorId: string) {
  const raw = randomBytes(32).toString('base64url');
  const idHash = hash(raw);
  const expiresAt = new Date(Date.now() + MAX_AGE * 1000);

  await db.insert(sessions).values({ idHash, actorId, expiresAt });

  return {
    cookie: {
      name: COOKIE,
      value: raw,
      options: {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax' as const,
        maxAge: MAX_AGE
      }
    }
  };
}

export async function verifySession(raw: string) {
  const idHash = hash(raw);
  const rows = await db
    .select({
      sessionId: sessions.idHash,
      id: actors.id,
      role: actors.role,
      districtId: actors.districtId,
      displayName: actors.displayName
    })
    .from(sessions)
    .innerJoin(actors, eq(actors.id, sessions.actorId))
    .where(and(eq(sessions.idHash, idHash), gt(sessions.expiresAt, new Date())))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  return {
    sessionId: row.sessionId,
    actor: {
      id: row.id,
      role: row.role,
      districtId: row.districtId,
      displayName: row.displayName
    }
  };
}

function hash(value: string) {
  return createHash('sha256').update(value).digest('hex');
}
```

Contraseñas:

- **Argon2id** con parámetros razonables (memoria 19 MiB, iteraciones 2, paralelismo 1) o `bcrypt` con costo 12.
- Nunca SHA-256/MD5 para contraseñas.
- Comparación en tiempo constante.
- Bloqueo progresivo tras intentos fallidos.

### 4.2 Cookies

| Atributo | Valor | Motivo |
|---|---|---|
| `HttpOnly` | Sí | No accesible desde JS |
| `Secure` | Sí en producción | Solo HTTPS |
| `SameSite` | `Lax` | Permite navegación normal; bloquea POST cross-site |
| `Path` | `/` | En v3 es el default, pero se declara |
| `Max-Age` | Según rol | Panel: corto |
| `Domain` | No definir | Evita compartir con subdominios |

### 4.3 CSRF

SvelteKit 3 verifica el origen de los formularios. Configuración:

```ts
// vite.config.ts
sveltekit({
  csrf: {
    trustedOrigins: ['https://app.cuadra.pe']
  }
})
```

Reglas:

- No añadir orígenes "por si acaso".
- Para APIs consumidas por terceros, usar token de API, no cookies.
- Las mutaciones desde el cliente usan `fetch` con `content-type: application/json` y misma origin.

---

## 5. Autorización (RBAC)

| Recurso | `citizen` | `operator` | `supervisor` | `admin` |
|---|---|---|---|---|
| Crear reporte | Sí | Sí | Sí | Sí |
| Ver su propio caso | Sí | Sí | Sí | Sí |
| Ver cualquier caso | No | Sí | Sí | Sí |
| Cambiar estado | No | Sí (asignados) | Sí | Sí |
| Asignar cuadrilla | No | Sí | Sí | Sí |
| Cerrar caso | No | No | Sí | Sí |
| Ver datos personales | No | Limitado | Sí | Sí |
| Exportar datos | No | No | Sí | Sí |
| Gestionar catálogos | No | No | No | Sí |

Implementación:

```ts
// src/lib/infra/server/authz.ts
import { error } from '@sveltejs/kit';
import type { App } from '$lib/types';

export function requireActor(locals: App.Locals): NonNullable<App.Locals['actor']> {
  if (!locals.actor) error(401, 'Debes iniciar sesión');
  return locals.actor;
}

export function requireRole(
  locals: App.Locals,
  roles: App.Locals['actor'] extends null ? never : Array<'operator' | 'supervisor' | 'admin'>
) {
  const actor = requireActor(locals);
  if (!roles.includes(actor.role as 'operator' | 'supervisor' | 'admin')) {
    error(403, 'No tienes permisos para esta acción');
  }
  return actor;
}

export function assertDistrict(actor: ReturnType<typeof requireActor>, districtId: string) {
  if (actor.role !== 'admin' && actor.districtId !== districtId) {
    error(403, 'No puedes operar fuera de tu distrito');
  }
}
```

Regla: **la autorización se comprueba en el servidor**, aunque la UI oculte botones. Nunca confiar en `data.actor` del cliente.

---

## 6. `handleError`

```ts
// src/hooks.server.ts
import type { HandleServerError } from '@sveltejs/kit/hooks';
import { log } from '$lib/infra/server/logger';

export const handleError: HandleServerError = ({ error, event, status, message, kind }) => {
  const requestId = event.locals.requestId ?? crypto.randomUUID();

  log.error(
    {
      requestId,
      kind,
      status,
      route: event.route.id,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    },
    'unhandled-error'
  );

  // No filtrar detalles internos al cliente
  return {
    message: status >= 500 ? 'Ocurrió un error. Intenta nuevamente.' : message,
    code: status >= 500 ? 'INTERNAL' : 'REQUEST',
    requestId
  };
};
```

Reglas:

- Loguear sin PII (sin descripción del reporte, sin coordenadas exactas).
- Devolver un mensaje accionable y el `requestId` para soporte.
- No devolver `stack` ni mensajes de base de datos.
- En v3, `handleError` recibe también errores esperados (`kind: 'app'`) y de validación.

---

## 7. `handleFetch`

Sirve para modificar las peticiones `fetch` que ocurren en el servidor (por ejemplo, `load` que llama a la API interna).

```ts
// src/hooks.server.ts
import type { HandleFetch } from '@sveltejs/kit/hooks';

const INTERNAL = new URL('http://127.0.0.1:3000');

export const handleFetch: HandleFetch = async ({ event, request, fetch }) => {
  const url = new URL(request.url);

  // Solo interceptar la API interna; nunca permitir SSRF
  if (url.origin === INTERNAL.origin) {
    request.headers.set('x-request-id', event.locals.requestId);
    if (event.locals.sessionId) {
      request.headers.set('x-internal-session', event.locals.sessionId);
    }
  }

  return fetch(request);
};
```

Reglas:

- Nunca reenviar cookies del usuario a orígenes externos.
- Validar el destino contra una allowlist.
- No usar `handleFetch` para lógica de negocio; solo para transporte.

---

## 8. `init`

```ts
// src/hooks.server.ts
import type { ServerInit } from '@sveltejs/kit/hooks';
import { initDb } from '$lib/infra/server/db';
import { assertEnv } from '$lib/infra/server/env-check';

export const init: ServerInit = async () => {
  assertEnv();
  await initDb();
};
```

Úsalo para:

- Abrir pool de base de datos.
- Verificar que las migraciones estén al día (solo en arranque, no en cada request).
- Inicializar cliente de Redis/S3.
- Fallar rápido si falta una variable.

No lo uses para lógica por request.

---

## 9. `reroute` y `transport`

```ts
// src/hooks.ts
import type { Reroute, Transport } from '@sveltejs/kit';

const aliases: Record<string, string> = {
  '/reporta': '/reportar',
  '/mis-casos': '/casos'
};

export const reroute: Reroute = ({ url }) => aliases[url.pathname];

export const transport: Transport = {
  Date: {
    encode: (value) => value instanceof Date && value.toISOString(),
    decode: (value) => new Date(value)
  }
};
```

- `reroute` para URLs legacy o i18n; no para redirecciones de negocio (usa `redirect`).
- `transport` para tipos que `devalue` no serializa por defecto (Date, Map, Set, clases del dominio).

---

## 10. Rate limiting

| Tipo de endpoint | Límite sugerido | Ventana |
|---|---:|---|
| `POST /auth/login` | 5 por IP + 10 por cuenta | 15 min |
| `POST /incidents` | 10 por usuario/dispositivo | 1 h |
| `POST /confirmations` | 30 por usuario | 1 h |
| `GET /incidents` | 120 por usuario | 1 min |
| `GET /public/*` | 60 por IP | 1 min |

Implementación distribuida con Redis (sliding window o token bucket). Para un solo nodo, un `Map` con limpieza periódica es suficiente, pero **no escala horizontalmente**.

Respuesta `429` con `Retry-After`, `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`.

---

## 11. Cabeceras de seguridad

```ts
const securityHeaders: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);
  response.headers.set('x-content-type-options', 'nosniff');
  response.headers.set('x-frame-options', 'DENY');
  response.headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  response.headers.set('permissions-policy', 'geolocation=(self), camera=(self), microphone=()');
  response.headers.set('strict-transport-security', 'max-age=31536000; includeSubDomains');
  response.headers.set('cross-origin-opener-policy', 'same-origin');
  return response;
};
```

CSP con SvelteKit 3:

```ts
sveltekit({
  csp: {
    mode: 'auto',
    directives: {
      'default-src': ['self'],
      'script-src': ['self'],
      'style-src': ['self', 'unsafe-inline'],
      'img-src': ['self', 'data:', 'blob:'],
      'connect-src': ['self', 'https://api.cuadra.pe'],
      'font-src': ['self'],
      'object-src': ['none'],
      'base-uri': ['self'],
      'frame-ancestors': ['none']
    }
  }
})
```

Notas:

- Evitar `unsafe-inline` en `script-src`; usar nonces de SvelteKit.
- `img-src blob:` es necesario para previews locales de evidencia.
- Revisar CSP al añadir mapas, analítica o fuentes externas.

---

## 12. Pruebas de hooks

```ts
// src/hooks.server.test.ts
import { describe, it, expect, vi } from 'vitest';
import { handle } from './hooks.server';

function mockEvent(overrides = {}) {
  return {
    request: new Request('http://localhost/api/v1/incidents'),
    url: new URL('http://localhost/api/v1/incidents'),
    route: { id: '/api/v1/incidents' },
    cookies: { get: () => undefined, delete: vi.fn(), set: vi.fn() },
    locals: {} as App.Locals,
    getClientAddress: () => '127.0.0.1',
    ...overrides
  } as any;
}

it('añade x-request-id', async () => {
  const response = await handle({
    event: mockEvent(),
    resolve: async () => new Response('ok')
  });
  expect(response.headers.get('x-request-id')).toBeTruthy();
});

it('devuelve 429 cuando se excede el límite', async () => {
  // mockear checkRateLimit para que devuelva { ok: false, retryAfter: 60, limit: 10 }
});
```

---

## 13. Antipatrones

| Antipatrón | Riesgo | Alternativa |
|---|---|---|
| Guardar el rol en una cookie sin firmar | Escalada de privilegios | Cookie opaca + lookup en servidor |
| JWT con datos sensibles en `localStorage` | XSS roba el token | Cookie HttpOnly + sesión opaca |
| `handle` que hace queries pesadas por request | Latencia | Cachear o mover a `load` |
| Rate limit solo en el cliente | Se evade | Servidor/Redis |
| CSP con `unsafe-eval` | XSS | Nonces y revisión |
| Devolver errores con stack | Fuga de información | `handleError` sanitizado |
| Autorizar en la UI | Bypass directo a la API | RBAC en servidor |

---

## 14. Checklist

- [ ] `App.Locals` tipado y sin datos sensibles serializados.
- [ ] `handle` compuesto con `sequence` y orden documentado.
- [ ] Cookie `sid` HttpOnly, Secure, SameSite=Lax.
- [ ] Sesiones revocables y con expiración.
- [ ] Contraseñas con Argon2id/bcrypt.
- [ ] RBAC aplicado en `load`, actions y endpoints.
- [ ] Rate limit en auth y escrituras.
- [ ] `handleError` sin PII ni stack.
- [ ] Cabeceras de seguridad y CSP configuradas.
- [ ] Pruebas de 401, 403 y 429.
