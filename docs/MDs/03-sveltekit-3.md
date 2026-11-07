# 03 · SvelteKit 3 en este proyecto

> **Base instalada:** `@sveltejs/kit` 3.1.1 · `svelte` 5.57.3 · `vite` 8.3.6 · `typescript` 6.0.3
> **Regla:** esta guía describe la API de **SvelteKit 3**, no la de SvelteKit 2. Varias APIs que aparecen en tutoriales antiguos ya no existen o están deprecadas.

---

## 1. Qué cambió en SvelteKit 3 (lo que afecta a este repo)

| Tema | SvelteKit 2 | SvelteKit 3 (actual) |
|---|---|---|
| Configuración | `svelte.config.js` | **Plugin `sveltekit()` en `vite.config.ts`**; `svelte.config.js` ya no se admite |
| Alias de librería | `$lib` | **`#lib`** (el proyecto ya lo usa) |
| Entorno de ejecución | `$app/environment` | **`$app/env`** (`browser`, `building`, `dev`, `version`) |
| Estado de página | `$app/stores` (`$page`) | **`$app/state`** (`page`) |
| Service worker | `$service-worker` | **`$app/manifest`** + **`$app/env`** + **`$app/paths`** + **`$app/service-worker`** |
| Variables de entorno | `$env/static/*`, `$env/dynamic/*` | **`src/env.ts` + `defineEnvVars` + `$app/env/public` / `$app/env/private`** (las `$env/*` quedan legacy) |
| `json()` / `text()` | Helpers de `@sveltejs/kit` | **Deprecados**; usar `Response.json()` / `new Response()` |
| Invalidación total | `invalidateAll()` | **`refreshAll()`** (no resetea `page.state`) |
| `goto` | `keepFocus`, `noScroll`, `replaceState` | **`reset: false`**, **`replace`** |
| `error()` | `error(status, message \| object)` | **`error(status, message, extra?)`**: el segundo argumento es string |
| Errores | `handleError` no recibía errores esperados | **`handleError` recibe todos** (`kind: 'app' \| 'framework' \| 'validation' \| 'unknown'`) |
| CSRF | `csrf.checkOrigin` | **`csrf.trustedOrigins`** |
| Service worker | registro con `type: 'classic'` | **`type: 'module'`** |
| Tipos de hooks | `@sveltejs/kit` | **`@sveltejs/kit/hooks`** (`Handle`, `HandleError`, etc.) |
| Tipos de params | `@sveltejs/kit` | **`@sveltejs/kit/params`** |
| tsconfig | `./.svelte-kit/tsconfig.json` | **`$app/tsconfig`** |

Fuente oficial: [Migrating to SvelteKit v3](https://svelte.dev/docs/kit/migrating-to-sveltekit-3).

---

## 2. Configuración actual del proyecto

`vite.config.ts` ya está en el formato correcto de v3:

```ts
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      compilerOptions: {
        runes: ({ filename }) =>
          filename.split(/[/\\]/).includes('node_modules') ? undefined : true
      },
      adapter: adapter()
    })
  ],
  test: {
    expect: { requireAssertions: true },
    projects: [
      {
        extends: './vite.config.ts',
        test: {
          name: 'server',
          environment: 'node',
          include: ['src/**/*.{test,spec}.{js,ts}'],
          exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
        }
      }
    ]
  }
});
```

Puntos a tener en cuenta:

- `defineConfig` se importa de **`vitest/config`**, no de `vite`, para que TypeScript acepte la clave `test`.
- `runes: true` fuerza runes en todo el código del proyecto; es correcto para una app nueva.
- `adapter-auto` debe reemplazarse por un adapter explícito antes de desplegar (ver [ADR-0005](adr/ADR-0005-adapter-node-postgres.md)).
- Para usar variables tipadas y hooks modernos, añadir `src/env.ts` y `src/hooks.server.ts`.

---

## 3. Estructura de rutas

```text
src/routes/
├─ +layout.svelte          # layout raíz
├─ +layout.server.ts       # datos comunes (sesión, distrito)
├─ +page.svelte            # /
├─ +page.server.ts         # load + actions de /
├─ +error.svelte           # errores de la rama
├─ (app)/                  # grupo de rutas (no afecta la URL)
│  ├─ reportar/+page.svelte
│  └─ casos/[code]/+page.svelte
├─ (panel)/bandeja/+page.server.ts
└─ api/v1/incidents/+server.ts
```

Reglas prácticas:

- **Grupos `(nombre)`** agrupan layouts y guards sin cambiar la URL.
- **`+page.server.ts`** solo debe usarse si se necesita acceso a secretos, base de datos o cookies.
- **`+page.ts`** corre en servidor y cliente; no importar módulos server-only.
- **`+layout.server.ts`** es el lugar para la sesión y el distrito activo.
- **`params`** se validan siempre; nunca confiar en `params.code` sin comprobar formato.

---

## 4. Carga de datos

### 4.1 `load` universal vs. de servidor

```ts
// src/routes/casos/[code]/+page.server.ts
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getIncidentByCode } from '$lib/infra/server/incident-postgres-repository';

export const load: PageServerLoad = async ({ params, locals, setHeaders }) => {
  if (!/^[A-Z0-9-]{6,12}$/.test(params.code)) {
    error(404, 'Caso no encontrado');
  }

  const incident = await getIncidentByCode(params.code);
  if (!incident) error(404, 'Caso no encontrado');

  // Solo el dueño o un operador puede ver el detalle completo
  const isOwner = incident.reporterId === locals.actor?.id;
  const isStaff = locals.actor?.role === 'operator' || locals.actor?.role === 'supervisor';
  if (!isOwner && !isStaff) error(403, 'No tienes acceso a este caso');

  setHeaders({ 'cache-control': 'private, max-age=0, no-store' });
  return { incident };
};
```

```svelte
<!-- src/routes/casos/[code]/+page.svelte -->
<script lang="ts">
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
</script>

<h1>{data.incident.code}</h1>
```

### 4.2 Streaming

Para datos lentos que no bloquean el render:

```ts
export const load: PageServerLoad = async ({ params }) => {
  return {
    incident: await getIncident(params.code),
    timeline: getTimeline(params.code) // Promise
  };
};
```

```svelte
{#await data.timeline}
  <p>Cargando historial…</p>
{:then events}
  <Timeline {events} />
{:catch}
  <p>No se pudo cargar el historial.</p>
{/await}
```

### 4.3 Invalidación

```ts
import { refreshAll, invalidate } from '$app/navigation';

await refreshAll();             // recarga todos los load
await invalidate('incidents');  // solo los load que dependen de 'incidents'
```

En `load`, declarar dependencias:

```ts
export const load = async ({ depends, fetch }) => {
  depends('incidents');
  const res = await fetch('/api/v1/incidents');
  return { incidents: await res.json() };
};
```

### 4.4 Errores y redirecciones

```ts
import { error, redirect } from '@sveltejs/kit';

if (!locals.actor) redirect(303, '/entrar?next=/panel');
if (payload.category === 'seguridad') error(422, 'Categoría no disponible', { code: 'SENSITIVE' });
```

> En v3, `error(422, 'mensaje', { code: 'SENSITIVE' })`: el segundo argumento es **string** y el tercero es el objeto extra.

---

## 5. Estado de página y runes

### 5.1 `$app/state` (reemplazo de `$app/stores`)

```svelte
<script lang="ts">
  import { page } from '$app/state';
</script>

<a href="/bandeja" aria-current={page.url.pathname === '/bandeja' ? 'page' : undefined}>
  Bandeja
</a>
```

`page` es reactivo y funciona en SSR. No hace falta `afterNavigate` para saber la ruta activa.

Propiedades: `page.url`, `page.params`, `page.route`, `page.status`, `page.error`, `page.data`, `page.state`.

### 5.2 Runes esenciales

```svelte
<script lang="ts">
  let count = $state(0);
  let doubled = $derived(count * 2);
  let { title, children } = $props();

  $effect(() => {
    document.title = title;
  });
</script>

<button onclick={() => count++}>{count} / {doubled}</button>
{@render children()}
```

Reglas:

- `$derived` para valores calculados; no usar `$effect` para derivar estado.
- `$effect` para sincronizar con APIs externas (título, mapa, `localStorage`), con cleanup.
- `$state.raw` para estructuras grandes que se reemplazan enteras.
- `$state.snapshot` antes de pasar estado a APIs que no entienden proxies (por ejemplo, `postMessage` a un worker).
- En archivos `.svelte.ts` se pueden exportar funciones que usan runes; útil para stores de UI.

### 5.3 Stores vs. runes

- **Datos del servidor:** `load` + `data`. No duplicar en stores.
- **Estado de UI:** runes locales o un `.svelte.ts`.
- **Estado global compartido:** un `.svelte.ts` con `$state`, no `writable` nuevo.
- Los stores existentes (`src/lib/stores.ts`) se pueden mantener, pero migrar a runes cuando se toquen.

---

## 6. Form actions y progressive enhancement

```ts
// src/routes/reportar/+page.server.ts
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions } from './$types';

const schema = z.object({
  category: z.enum(['pistas', 'basura', 'alumbrado', 'agua', 'transporte', 'espacios']),
  description: z.string().min(10).max(500),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180)
});

export const actions = {
  default: async ({ request, locals }) => {
    const form = await request.formData();
    const parsed = schema.safeParse(Object.fromEntries(form));

    if (!parsed.success) {
      return fail(400, {
        values: Object.fromEntries(form),
        errors: parsed.error.flatten().fieldErrors
      });
    }

    const incident = await reportIncident({ ...parsed.data, actor: locals.actor });
    redirect(303, `/casos/${incident.code}`);
  }
} satisfies Actions;
```

```svelte
<script lang="ts">
  import { enhance } from '$app/forms';
  let { form } = $props();
</script>

<form method="POST" use:enhance>
  <label for="description">¿Qué pasa?</label>
  <textarea id="description" name="description" value={form?.values?.description ?? ''}></textarea>
  {#if form?.errors?.description}
    <p role="alert">{form.errors.description[0]}</p>
  {/if}
  <button type="submit">Reportar</button>
</form>
```

Buenas prácticas:

- Validar en servidor siempre; el cliente valida para UX, no para seguridad.
- Devolver `fail` con `values` para no perder lo escrito.
- Usar `redirect(303, ...)` tras éxito (PRG pattern).
- En v3, las respuestas de actions con `fail` usan el status de `fail` (no siempre 200).

---

## 7. Endpoints (`+server.ts`)

```ts
// src/routes/api/v1/incidents/+server.ts
import type { RequestHandler } from './$types';
import { z } from 'zod';

const querySchema = z.object({
  status: z.enum(['submitted', 'triaged', 'assigned', 'in_progress', 'resolved', 'closed']).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const GET: RequestHandler = async ({ url, locals }) => {
  if (!locals.actor) {
    return Response.json(
      { type: 'about:blank', title: 'No autenticado', status: 401 },
      { status: 401, headers: { 'content-type': 'application/problem+json' } }
    );
  }

  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return Response.json(
      { type: 'about:blank', title: 'Parámetros inválidos', status: 400, errors: parsed.error.issues },
      { status: 400, headers: { 'content-type': 'application/problem+json' } }
    );
  }

  const page = await listIncidents(parsed.data);
  return Response.json(page, {
    headers: { 'cache-control': 'private, max-age=0, no-store' }
  });
};
```

> `json()` y `text()` de `@sveltejs/kit` están deprecados en v3. Usar `Response.json()`.

---

## 8. Remote functions (experimental)

SvelteKit 3 incluye `query`, `form`, `command` y `prerender` en archivos `*.remote.ts`. Están **detrás de flags**:

```ts
// vite.config.ts
sveltekit({
  compilerOptions: { experimental: { async: true } },
  experimental: { remoteFunctions: true }
})
```

```ts
// src/routes/reportar/data.remote.ts
import { query, command } from '$app/server';
import { z } from 'zod';

export const listCategories = query(async () => {
  return db.query.categories.findMany();
});

export const confirmIncident = command(
  z.object({ incidentId: z.string().uuid() }),
  async ({ incidentId }) => {
    await confirm(incidentId);
    return { ok: true };
  }
);
```

**Recomendación para el MVP:** no usarlas todavía. Añaden una capa nueva y experimental; el equipo necesita primero dominio, offline y API estable. Reevaluar después del piloto.

---

## 9. Variables de entorno tipadas

SvelteKit 3 reemplaza `$env/*` por un archivo `src/env.ts` con `defineEnvVars`.

```ts
// src/env.ts
import { defineEnvVars } from '@sveltejs/kit/env';
import * as v from 'valibot';

export const variables = defineEnvVars({
  DATABASE_URL: {
    schema: v.pipe(v.string(), v.url()),
    description: 'Cadena de conexión a PostgreSQL'
  },
  SESSION_SECRET: {
    schema: v.pipe(v.string(), v.minLength(32)),
    description: 'Secreto para firmar cookies de sesión'
  },
  PUBLIC_API_BASE: {
    public: true,
    schema: v.pipe(v.string(), v.url()),
    description: 'URL base de la API para el cliente'
  },
  APP_VERSION: {
    public: true,
    static: true,
    schema: v.optional(v.string(), 'dev')
  }
});
```

Uso:

```ts
import { DATABASE_URL, SESSION_SECRET } from '$app/env/private';
import { PUBLIC_API_BASE } from '$app/env/public';
```

Reglas:

- `public: true` ⇒ visible en el bundle; nunca poner secretos.
- `static: true` ⇒ se inlinea en build; útil para flags de compilación.
- La validación falla al arrancar o al construir si falta una variable requerida.
- Para variables opcionales durante el build, usar `building` de `$app/env`.
- En `app.html` se pueden interpolar variables públicas: `%sveltekit.env.PUBLIC_API_BASE%`.

> `defineEnvVars` acepta cualquier [Standard Schema](https://standardschema.dev/), no solo Valibot. Zod también sirve.

---

## 10. Hooks (resumen; detalle en 07)

```ts
// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit/hooks';
import { sequence } from '@sveltejs/kit/hooks';

const session: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get('sid');
  event.locals.actor = token ? await verifySession(token) : null;
  return resolve(event);
};

const securityHeaders: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);
  response.headers.set('x-content-type-options', 'nosniff');
  response.headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  return response;
};

export const handle = sequence(session, securityHeaders);
```

En v3 los tipos viven en `@sveltejs/kit/hooks`; `handleError` recibe todos los errores y puede influir en el status.

---

## 11. Adapters

| Adapter | Cuándo usarlo | Nota |
|---|---|---|
| `@sveltejs/adapter-node` | Servidor propio, Docker, VPS, on-premise municipal | **Recomendado para el MVP** |
| `@sveltejs/adapter-cloudflare` | Cloudflare Workers/Pages | Requiere revisar límites de runtime y almacenamiento |
| `@sveltejs/adapter-vercel` | Vercel | Funciones serverless; cuidado con conexiones a Postgres |
| `@sveltejs/adapter-static` | Sitio totalmente estático | No sirve si hay API/sesión en el mismo proyecto |

Con `adapter-auto` el build elige un destino según el entorno; es cómodo para empezar, pero **no es una decisión de producción**.

---

## 12. Checklist de migración/ajuste para este repositorio

- [ ] `$app/environment` → `$app/env` en `src/lib/components/Layout.svelte` y `src/lib/stores.ts`.
- [ ] `afterNavigate` + `$state` para ruta activa → `page` de `$app/state`.
- [ ] `svelte.config.js` inexistente: correcto, no crearlo.
- [ ] `$lib` → `#lib`: ya está; mantener consistencia.
- [ ] `json()`/`text()`: no se usan aún; no introducirlos.
- [ ] `invalidateAll()` → `refreshAll()` cuando se implemente refresco.
- [ ] `error(404, '...')` con string; extras en tercer argumento.
- [ ] `src/app.d.ts` con `App.Locals`, `App.PageData`, `App.Error`.
- [ ] `src/env.ts` con `defineEnvVars`.
- [ ] `adapter-auto` → `adapter-node`.
- [ ] `lang="en"` → `lang="es-PE"` en `src/app.html`.
- [ ] Importar `layout.css` en `+layout.svelte` (hoy no se importa).

---

## 13. Errores comunes y cómo evitarlos

| Error | Síntoma | Solución |
|---|---|---|
| Importar un módulo server-only en `+page.ts` | Build falla o secreto en bundle | Mover a `+page.server.ts` o `$lib/infra/server` |
| Usar `window` en SSR | `window is not defined` | Guardar con `browser` de `$app/env` o `onMount` |
| `fetch` relativo en `load` de servidor | Falla en SSR | Usar `event.fetch` o URL absoluta |
| Estado global para datos de página | Datos obsoletos entre navegaciones | Usar `data` de `load` + `refreshAll` |
| `$effect` que escribe estado derivado | Bucles y renders extra | Usar `$derived` |
| `$state` con clases complejas | Proxies inesperados | `$state.raw` o `$state.snapshot` |
| No validar `params` | 500 en lugar de 404 | Validar formato y lanzar `error(404, ...)` |
| Cookie sin `path` | No se envía en todas las rutas | En v3 el path por defecto es `/`; aun así, declararlo |

---

## 14. Mapa de documentación oficial

| Tema | Enlace |
|---|---|
| Introducción | https://svelte.dev/docs/kit/introduction |
| Estructura del proyecto | https://svelte.dev/docs/kit/project-structure |
| Routing | https://svelte.dev/docs/kit/routing |
| Carga de datos | https://svelte.dev/docs/kit/load |
| Form actions | https://svelte.dev/docs/kit/form-actions |
| Remote functions | https://svelte.dev/docs/kit/remote-functions |
| Hooks | https://svelte.dev/docs/kit/hooks |
| Service workers | https://svelte.dev/docs/kit/service-workers |
| Variables de entorno | https://svelte.dev/docs/kit/environment-variables |
| Adaptadores | https://svelte.dev/docs/kit/adapters |
| Migración a v3 | https://svelte.dev/docs/kit/migrating-to-sveltekit-3 |
| `$app/state` | https://svelte.dev/docs/kit/$app-state |
| `$app/env` | https://svelte.dev/docs/kit/$app-env |
| `$app/manifest` | https://svelte.dev/docs/kit/$app-manifest |
| `$app/service-worker` | https://svelte.dev/docs/kit/$app-service-worker |
| `$app/tsconfig/service-worker` | https://svelte.dev/docs/kit/$app-tsconfig-service-worker |
| Runes de Svelte 5 | https://svelte.dev/docs/svelte/what-are-runes |
| Accesibilidad | https://svelte.dev/docs/kit/accessibility |

---

## 15. Criterio de aceptación de esta guía

Un desarrollador nuevo debe poder:

1. Crear una ruta con `load` tipado y validación de `params`.
2. Implementar un endpoint `+server.ts` con errores RFC 9457.
3. Usar `page` de `$app/state` sin recurrir a `$app/stores`.
4. Declarar una variable de entorno tipada y consumirla sin filtrar secretos.
5. Explicar por qué `adapter-auto` no es una decisión de producción.

Si alguno de estos puntos falla, la guía o el código base deben corregirse antes de abrir features.
