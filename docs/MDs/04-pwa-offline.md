# 04 · PWA y estrategia offline

> **Objetivo:** que un vecino pueda reportar un problema sin señal, cerrar la app, y que el reporte se envíe solo cuando vuelva la conexión; que la app se instale sin pasar por una tienda y que una actualización no le rompa un formulario abierto.

---

## 1. Por qué PWA y no app nativa

| Criterio | PWA | App nativa |
|---|---|---|
| Distribución | Un enlace; sin tienda ni aprobación | App Store / Play Store; cuenta y revisión |
| Instalación | "Añadir a pantalla de inicio" | Descarga de 20–80 MB |
| Actualizaciones | Inmediatas al publicar | Versión del usuario; adopción lenta |
| Offline | Service worker + IndexedDB | Nativo, más control |
| Hardware | Limitado (sin NFC avanzado, Bluetooth clásico) | Acceso completo |
| Costo | Un código para Android/iOS/desktop | Dos o tres bases |
| Ideal para | Reportes, consultas, panel liviano | Cámara intensiva, mapas offline grandes, background real |

Para el MVP, la PWA gana: el costo de adquisición es casi cero, el flujo es corto y el offline se resuelve con service worker + IndexedDB. Si en el futuro se necesita captura intensiva o notificaciones críticas, se evalúa un wrapper nativo.

---

## 2. Archivos que deben existir

```text
src/
├─ service-worker/
│  ├─ index.ts              # el service worker
│  └─ tsconfig.json         # extiende $app/tsconfig/service-worker
├─ rutas/
│  ├─ offline/+page.svelte  # fallback de navegación
│  └─ +layout.svelte        # importa layout.css y registra la UI de update
└─ app.html                 # manifest, theme-color, apple-touch-icon
static/
├─ manifest.webmanifest
├─ icons/
│  ├─ icon-192.png
│  ├─ icon-512.png
│  ├─ icon-maskable-512.png
│  └─ apple-touch-icon-180.png
└─ screenshots/
   ├─ home-390x844.png
   └─ panel-1280x800.png
```

> En SvelteKit 3, si existe `src/service-worker/index.ts`, se empaqueta y se registra automáticamente como **module worker**. No hay que registrarlo a mano.

---

## 3. Configuración de TypeScript

El service worker necesita su propio proyecto de TypeScript; de lo contrario, los tipos de `fetch` y `self` son incorrectos.

`src/service-worker/tsconfig.json`:

```json
{
  "extends": "$app/tsconfig/service-worker"
}
```

`tsconfig.json` raíz: excluir el service worker del proyecto principal.

```json
{
  "extends": "$app/tsconfig",
  "compilerOptions": {
    "strict": true,
    "types": ["$app/types", "node"]
  },
  "include": ["src", "vite.config.ts", "prettier.config.js", "eslint.config.js"],
  "exclude": ["src/service-worker"]
}
```

---

## 4. Manifest

`static/manifest.webmanifest`:

```json
{
  "id": "/",
  "name": "Cuadra — Reporta tu cuadra",
  "short_name": "Cuadra",
  "description": "Reporta y sigue incidencias de tu cuadra, incluso sin señal.",
  "lang": "es-PE",
  "dir": "ltr",
  "start_url": "/?source=pwa",
  "scope": "/",
  "display": "standalone",
  "display_override": ["window-controls-overlay", "standalone", "minimal-ui"],
  "orientation": "portrait-primary",
  "theme_color": "#0f172a",
  "background_color": "#f8fafc",
  "categories": ["government", "utilities", "productivity"],
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    {
      "src": "/icons/icon-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "screenshots": [
    { "src": "/screenshots/home-390x844.png", "sizes": "390x844", "type": "image/png", "form_factor": "narrow" },
    { "src": "/screenshots/panel-1280x800.png", "sizes": "1280x800", "type": "image/png", "form_factor": "wide" }
  ],
  "shortcuts": [
    {
      "name": "Reportar ahora",
      "short_name": "Reportar",
      "url": "/reportar?source=shortcut",
      "icons": [{ "src": "/icons/icon-192.png", "sizes": "192x192" }]
    },
    {
      "name": "Mis casos",
      "short_name": "Mis casos",
      "url": "/casos?source=shortcut",
      "icons": [{ "src": "/icons/icon-192.png", "sizes": "192x192" }]
    }
  ]
}
```

`src/app.html`:

```html
<!doctype html>
<html lang="es-PE">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#0f172a" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#020617" media="(prefers-color-scheme: dark)" />
    <meta name="description" content="Reporta y sigue incidencias de tu cuadra." />
    <link rel="manifest" href="%sveltekit.assets%/manifest.webmanifest" />
    <link rel="apple-touch-icon" href="%sveltekit.assets%/icons/apple-touch-icon-180.png" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Cuadra" />
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

Checklist del manifest:

- [ ] `name` y `short_name` legibles en español.
- [ ] `start_url` dentro de `scope`.
- [ ] `display: standalone` (o `minimal-ui`).
- [ ] Iconos 192 y 512, más uno `maskable`.
- [ ] `theme_color` y `background_color` coherentes con la marca.
- [ ] `lang: "es-PE"`.
- [ ] Screenshots para el install prompt en Android.
- [ ] `id` estable para no duplicar instalaciones.

---

## 5. Service worker

`src/service-worker/index.ts`:

```ts
/// <reference types="@sveltejs/kit" />
import { self } from '$app/service-worker';
import { version } from '$app/env';
import { assets, immutable, prerendered } from '$app/manifest';
import { asset, resolve } from '$app/paths';

const CACHE = `cuadra-${version}`;
const OFFLINE_URL = resolve('/offline');
const PRECACHE = [
  ...assets.map((a) => a.path),
  ...immutable.map((a) => a.path),
  ...prerendered.map((p) => p.path),
  OFFLINE_URL
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo mismo origen
  if (url.origin !== self.location.origin) return;

  // Mutaciones: nunca cachear; el outbox las maneja
  if (request.method !== 'GET') return;

  // Navegación: network-first con fallback offline
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // Assets inmutables: cache-first
  if (immutable.some((a) => url.pathname === a.path)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // API de lectura: network-first con timeout y caché de respaldo
  if (url.pathname.startsWith('/api/v1/')) {
    event.respondWith(networkFirstJson(request));
    return;
  }

  // Imágenes y fuentes: stale-while-revalidate
  if (request.destination === 'image' || request.destination === 'font') {
    event.respondWith(staleWhileRevalidate(request));
  }
});

async function cacheFirst(request: Request): Promise<Response> {
  const cached = await caches.match(request);
  return cached ?? fetch(request);
}

async function networkFirstNavigation(request: Request): Promise<Response> {
  try {
    return await fetch(request);
  } catch {
    const cached = await caches.match(request);
    return cached ?? caches.match(OFFLINE_URL).then((r) => r ?? Response.error());
  }
}

async function networkFirstJson(request: Request): Promise<Response> {
  const cache = await caches.open(CACHE);
  try {
    const response = await withTimeout(fetch(request), 4000);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return Response.json(
      { type: 'about:blank', title: 'Sin conexión', status: 503 },
      { status: 503, headers: { 'content-type': 'application/problem+json' } }
    );
  }
}

async function staleWhileRevalidate(request: Request): Promise<Response> {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached ?? Response.error());
  return cached ?? network;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
  ]);
}

// Actualización controlada desde la UI
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// Background Sync (Chromium)
self.addEventListener('sync', (event) => {
  if (event.tag === 'cuadra-outbox') {
    event.waitUntil(self.clients.matchAll({ includeUncontrolled: true }).then((clients) => {
      for (const client of clients) client.postMessage({ type: 'OUTBOX_SYNC' });
    }));
  }
});

// Push (opcional, post-MVP)
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Cuadra', {
      body: data.body ?? 'Tienes una actualización de tu caso.',
      icon: '/icons/icon-192.png',
      data: { url: data.url ?? '/casos' }
    })
  );
});
```

### Estrategias por tipo de recurso

| Recurso | Estrategia | Motivo |
|---|---|---|
| Navegación HTML | Network-first + fallback `/offline` | Contenido fresco; nunca dejar pantalla en blanco |
| JS/CSS con hash (`immutable`) | Cache-first | Son inmutables; máximo rendimiento |
| `static/` (iconos, manifest) | Cache-first | Cambian poco |
| `GET /api/v1/categories` | Stale-while-revalidate | Catálogo estable; tolera datos algo viejos |
| `GET /api/v1/incidents` | Network-first con timeout | Datos operativos; caché solo como respaldo |
| `POST/PATCH /api/v1/*` | Network-only + outbox | Nunca fingir una escritura |
| Imágenes de evidencia | No cachear en SW | Ya viven en IndexedDB; evitar duplicar GB |
| Fuentes | Cache-first | Cambian poco; evita FOUT |

Regla de oro: **nunca cachear respuestas autenticadas de HTML ni endpoints con datos personales**.

---

## 6. Outbox y sincronización

El service worker **no** debe ser el dueño de la lógica de negocio. La cola vive en IndexedDB y el cliente la procesa; el SW solo despierta a los clientes cuando hay conectividad.

```ts
// src/lib/infra/idb/outbox.ts
export type OutboxOp = {
  id: string;                 // UUIDv7
  type: 'create-incident' | 'confirm-incident' | 'upload-evidence';
  payload: unknown;
  idempotencyKey: string;
  attempts: number;
  nextAttemptAt: number;
  state: 'pending' | 'inflight' | 'done' | 'failed' | 'conflict';
  createdAt: number;
};

const MAX_ATTEMPTS = 8;
const BASE_DELAY = 2_000;

export function backoff(attempts: number): number {
  const exp = Math.min(BASE_DELAY * 2 ** attempts, 5 * 60_000);
  return exp + Math.random() * 1_000; // jitter
}
```

Reglas:

1. **Idempotencia:** `Idempotency-Key` se genera al crear la operación y no cambia en reintentos.
2. **Orden:** se procesa por `createdAt`; una operación `failed` no bloquea las demás del mismo tipo.
3. **Backoff:** exponencial con jitter, máximo 5 minutos; tras 8 intentos pasa a `failed` y se avisa al usuario.
4. **Conflicto:** `409` con el estado actual; se muestra una pantalla de resolución (conservar local o servidor).
5. **Background Sync:** si `'sync' in registration`, registrar `cuadra-outbox`; si no, escuchar `online` y reintentar al enfocar.
6. **Al cerrar la app:** el outbox persiste; no se pierde.

---

## 7. Instalación y actualización

### 7.1 Prompt de instalación

```ts
// src/lib/pwa/install.ts
let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
  });
}

export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredPrompt) return 'unavailable';
  await deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  return outcome;
}
```

En iOS no existe `beforeinstallprompt`; mostrar instrucciones: **Compartir → Añadir a pantalla de inicio**.

### 7.2 Actualización sin romper formularios

```ts
// src/lib/pwa/update.ts
export function watchForUpdates(onUpdate: () => void) {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.ready.then((registration) => {
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      if (!worker) return;

      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          onUpdate(); // mostrar banner "Nueva versión disponible"
        }
      });
    });
  });
}

export function applyUpdate() {
  navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });
  window.location.reload();
}
```

Regla: **no llamar `skipWaiting()` automáticamente** si hay un formulario con datos sin enviar. Mostrar un banner y dejar que el usuario decida.

---

## 8. Almacenamiento y cuotas

- Pedir persistencia al primer reporte:

```ts
if (navigator.storage?.persist) {
  await navigator.storage.persist();
}
const estimate = await navigator.storage?.estimate();
console.log(estimate?.usage, estimate?.quota);
```

- Si la cuota es baja (< 50 MB), limitar evidencias locales a las no sincronizadas.
- Política de evicción:
  - Borrar evidencias sincronizadas con más de 30 días.
  - Nunca borrar `outbox` pendiente.
  - Si el navegador desaloja el origen, el outbox se pierde: por eso se advierte "No cierres la app hasta que se envíe" solo cuando hay un reporte pendiente y se intenta sincronizar de inmediato.
- En iOS, el almacenamiento puede purgarse tras 7 días sin uso; no prometer offline permanente.

---

## 9. Matriz de compatibilidad

| Capacidad | Android Chrome | iOS Safari | Desktop |
|---|---|---|---|
| Instalación | Sí (prompt) | Manual (Compartir) | Sí |
| Service worker | Sí | Sí (16.4+) | Sí |
| Background Sync | Sí | **No** | Limitado |
| Push | Sí | Sí (16.4+, instalada) | Sí |
| IndexedDB persistente | Sí (con `persist()`) | Limitado | Sí |
| `beforeinstallprompt` | Sí | **No** | Según navegador |

Conclusión: el flujo offline debe funcionar **sin** Background Sync. Esa API es una mejora, no un requisito.

---

## 10. Pruebas de PWA

| Prueba | Herramienta | Criterio |
|---|---|---|
| Instalable | Lighthouse / Chrome DevTools → Application | Manifest válido, SW activo, iconos |
| Offline frío | Playwright `context.setOffline(true)` + recarga | Se ve `/offline`, no error de red |
| Reporte offline | Playwright: crear reporte sin red, reconectar | El reporte aparece y se sincroniza |
| Actualización | DevTools → Update on reload | Banner de nueva versión; no se pierde el formulario |
| Cuota | DevTools → Storage | La app no supera el presupuesto definido |
| iOS | Safari real o BrowserStack | Instalación manual y offline básico |

Ejemplo Playwright:

```ts
test('reporta sin conexión y sincroniza al reconectar', async ({ page, context }) => {
  await page.goto('/reportar');
  await context.setOffline(true);
  await page.getByLabel('¿Qué pasa?').fill('Bache profundo frente al mercado');
  await page.getByRole('button', { name: 'Reportar' }).click();
  await expect(page.getByText('Guardado en tu dispositivo')).toBeVisible();

  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(page.getByText(/Caso .* enviado/)).toBeVisible({ timeout: 15_000 });
});
```

---

## 11. Checklist de salida

- [ ] `manifest.webmanifest` válido y accesible.
- [ ] `src/service-worker/index.ts` compila y se registra.
- [ ] `src/service-worker/tsconfig.json` existe y el root lo excluye.
- [ ] Precache incluye shell, assets inmutables y `/offline`.
- [ ] Navegación offline muestra una página útil con enlaces.
- [ ] Reporte offline se guarda y sincroniza.
- [ ] Actualización pide confirmación y no pierde datos.
- [ ] No se cachean respuestas autenticadas ni PII.
- [ ] Lighthouse: instalable, sin errores de SW.
- [ ] Probado en Android real y iOS real.
