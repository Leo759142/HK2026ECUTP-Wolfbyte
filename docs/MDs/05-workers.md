# 05 · Web Workers, Service Worker y procesamiento local

> **Objetivo:** que la app siga respondiendo en un Android de gama baja mientras comprime fotos, calcula hashes y prepara la cola de sincronización. El hilo principal se reserva para la UI.

---

## 1. Tres tipos de worker que no son lo mismo

| Tipo | Archivo | Vive en | Se comunica con | Úsalo para |
|---|---|---|---|---|
| **Web Worker** (dedicado) | `src/lib/infra/workers/*.worker.ts` | Pestaña | `postMessage` / `onmessage` | Comprimir imágenes, hashear, indexar texto |
| **Shared Worker** | `*.shared-worker.ts` | Varias pestañas | `port.postMessage` | Estado compartido entre pestañas (poco frecuente) |
| **Service Worker** | `src/service-worker/index.ts` | Origen, fuera de la página | `postMessage`, `fetch`, `sync`, `push` | Caché, offline, background sync, push |

Reglas:

- El **service worker no comprime fotos**: no tiene DOM y su ciclo de vida es impredecible.
- El **web worker no accede a IndexedDB de forma fiable en todos los navegadores**; la persistencia la hace el hilo principal o un adaptador probado.
- El **hilo principal no hace cómputo pesado**: si una operación tarda más de 50 ms, se mueve a un worker.

---

## 2. Patrón de creación con Vite

```ts
// src/lib/infra/workers/create-worker.ts
import { browser } from '$app/env';

export function createImageWorker(): Worker | null {
  if (!browser) return null;
  return new Worker(new URL('./image.worker.ts', import.meta.url), { type: 'module' });
}
```

Ventajas del patrón `new URL(..., import.meta.url)`:

- Vite detecta el worker y lo empaqueta.
- Funciona en dev y build.
- No requiere configuración extra.

Para workers que se usan muchas veces, crear un **pool** y reutilizarlos; crear un worker por foto es caro.

---

## 3. Pipeline de imagen

### 3.1 Requisitos

| Requisito | Valor | Motivo |
|---|---|---|
| Lado mayor | 1600 px | Suficiente para triaje; reduce peso |
| Formato | WebP (fallback JPEG) | Mejor compresión con calidad aceptable |
| Calidad | 0.78 | Equilibrio visual/peso |
| Peso objetivo | ≤ 450 KB | Datos móviles limitados |
| EXIF | Eliminado | Privacidad (GPS, modelo, fecha) |
| Orientación | Aplicada antes de borrar EXIF | Evitar fotos giradas |
| Miniatura | 320 px | Lista y mapa |

### 3.2 Worker

```ts
// src/lib/infra/workers/image.worker.ts
/// <reference lib="webworker" />

type Incoming =
  | { id: string; type: 'compress'; file: File; maxSize: number; quality: number }
  | { id: string; type: 'thumb'; file: File; size: number };

type Outgoing =
  | { id: string; type: 'done'; blob: Blob; width: number; height: number; hash: string }
  | { id: string; type: 'error'; message: string }
  | { id: string; type: 'progress'; value: number };

self.onmessage = async (event: MessageEvent<Incoming>) => {
  const msg = event.data;
  try {
    if (msg.type === 'compress') {
      const result = await compress(msg.file, msg.maxSize, msg.quality, (value) =>
        post({ id: msg.id, type: 'progress', value })
      );
      post({ id: msg.id, type: 'done', ...result });
    } else {
      const result = await thumbnail(msg.file, msg.size);
      post({ id: msg.id, type: 'done', ...result });
    }
  } catch (error) {
    post({ id: msg.id, type: 'error', message: (error as Error).message });
  }
};

function post(message: Outgoing) {
  (self as DedicatedWorkerGlobalScope).postMessage(message);
}

async function compress(
  file: File,
  maxSize: number,
  quality: number,
  onProgress: (value: number) => void
) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo crear el contexto 2D');

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  onProgress(0.6);

  const blob = await canvas.convertToBlob({ type: 'image/webp', quality });
  onProgress(0.9);

  const hash = await sha256(await blob.arrayBuffer());
  onProgress(1);

  return { blob, width, height, hash };
}

async function thumbnail(file: File, size: number) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, size / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo crear el contexto 2D');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await canvas.convertToBlob({ type: 'image/webp', quality: 0.7 });
  return { blob, width, height, hash: await sha256(await blob.arrayBuffer()) };
}

async function sha256(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
```

### 3.3 Limitaciones y fallback

- `OffscreenCanvas` y `convertToBlob` no están en todos los navegadores antiguos. Detectar:

```ts
const supportsOffscreen =
  typeof OffscreenCanvas !== 'undefined' && 'convertToBlob' in OffscreenCanvas.prototype;
```

- Si no hay soporte, comprimir en el hilo principal con `<canvas>` y `toBlob`, aceptando el costo (con aviso de "procesando…").
- `createImageBitmap(file, { imageOrientation: 'from-image' })` aplica la orientación EXIF; si no, la foto puede salir rotada.
- **No prometer borrado automático de rostros/placas** en el MVP. Si se requiere, implementar una herramienta de difuminado manual en la UI y registrar que la evidencia fue redactada.

### 3.4 Privacidad

Antes de subir:

1. Aplicar orientación.
2. Redimensionar.
3. Re-codificar (elimina metadatos EXIF, incluido GPS).
4. Calcular hash.
5. (Opcional) difuminar zonas seleccionadas por el usuario.

Nunca subir el archivo original con EXIF.

---

## 4. Hash perceptual y deduplicación

El SHA-256 detecta archivos idénticos, no fotos parecidas. Para agrupar el mismo bache tomado desde ángulos distintos, usar un **dHash** de 64 bits.

```ts
// src/lib/infra/workers/hash.worker.ts
export function dHash(bitmap: ImageBitmap): bigint {
  const size = 9;
  const canvas = new OffscreenCanvas(size, 8);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, size, 8);
  const { data } = ctx.getImageData(0, 0, size, 8);

  let hash = 0n;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const i = (y * size + x) * 4;
      const j = (y * size + x + 1) * 4;
      const left = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      const right = data[j] * 0.299 + data[j + 1] * 0.587 + data[j + 2] * 0.114;
      hash = (hash << 1n) | (left > right ? 1n : 0n);
    }
  }
  return hash;
}

export function hamming(a: bigint, b: bigint): number {
  let x = a ^ b;
  let count = 0;
  while (x) {
    count += Number(x & 1n);
    x >>= 1n;
  }
  return count;
}
```

Criterio de duplicado:

- `hamming(a, b) ≤ 6` **y** distancia geográfica ≤ 30 m **y** ventana temporal ≤ 72 h.
- Si se cumple, agrupar como duplicado y sumar confirmaciones; no crear otro caso.
- El cálculo final se valida en servidor; el cliente solo sugiere.

---

## 5. Pool de workers

```ts
// src/lib/infra/workers/worker-pool.ts
type Task<T> = {
  run: (worker: Worker) => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
};

export class WorkerPool {
  private idle: Worker[] = [];
  private queue: Task<unknown>[] = [];
  private all: Worker[] = [];

  constructor(
    private factory: () => Worker,
    private size = Math.min(2, Math.max(1, (navigator.hardwareConcurrency ?? 2) - 1))
  ) {
    for (let i = 0; i < size; i++) {
      const worker = factory();
      this.all.push(worker);
      this.idle.push(worker);
    }
  }

  run<T>(task: (worker: Worker) => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ run: task, resolve: resolve as (v: unknown) => void, reject });
      this.drain();
    });
  }

  private drain() {
    while (this.idle.length && this.queue.length) {
      const worker = this.idle.pop()!;
      const task = this.queue.shift()!;
      task
        .run(worker)
        .then(task.resolve, task.reject)
        .finally(() => {
          this.idle.push(worker);
          this.drain();
        });
    }
  }

  destroy() {
    for (const worker of this.all) worker.terminate();
    this.all = [];
    this.idle = [];
    this.queue = [];
  }
}
```

Recomendaciones:

- Tamaño del pool: `min(2, hardwareConcurrency - 1)`. En gama baja, 1 o 2; más workers compiten por CPU y batería.
- Un worker por tarea pesada, no por archivo.
- Cancelación: incluir un `AbortSignal` en el mensaje y comprobar `signal.aborted` en puntos seguros; no se puede matar un worker a mitad de una operación sin perderlo.
- Timeout: si un worker no responde en 15 s, terminarlo y recrearlo.

---

## 6. Transferables y costo de copia

`postMessage` clona estructuras. Para buffers grandes:

```ts
const buffer = await blob.arrayBuffer();
worker.postMessage({ type: 'hash', buffer }, [buffer]); // transfiere, no copia
```

Reglas:

- Transferir `ArrayBuffer`, no `Blob` gigantes.
- Un `File`/`Blob` se clona por referencia interna en la mayoría de navegadores; aun así, para imágenes grandes es mejor transferir el buffer.
- No enviar proxies de Svelte (`$state`) a un worker: usar `$state.snapshot(value)`.
- Mantener los mensajes pequeños: `{ id, type, payload }`.

---

## 7. Integración con Svelte 5

```svelte
<script lang="ts">
  import { createImageWorker } from '$lib/infra/workers/create-worker';

  let file = $state<File | null>(null);
  let progress = $state(0);
  let preview = $state<string | null>(null);
  let error = $state<string | null>(null);

  const worker = createImageWorker();

  async function onFile(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    file = input.files?.[0] ?? null;
    if (!file || !worker) return;

    progress = 0;
    error = null;

    const id = crypto.randomUUID();
    worker.onmessage = (event) => {
      const msg = event.data;
      if (msg.id !== id) return;
      if (msg.type === 'progress') progress = msg.value;
      if (msg.type === 'error') error = msg.message;
      if (msg.type === 'done') {
        preview = URL.createObjectURL(msg.blob);
        progress = 1;
      }
    };

    worker.postMessage({ id, type: 'compress', file, maxSize: 1600, quality: 0.78 });
  }
</script>

<input type="file" accept="image/*" capture="environment" onchange={onFile} />
{#if progress > 0 && progress < 1}
  <progress value={progress} max="1"></progress>
{/if}
{#if error}<p role="alert">{error}</p>{/if}
{#if preview}<img src={preview} alt="Vista previa del reporte" />{/if}
```

Notas:

- Crear el worker en el cliente; en SSR `createImageWorker()` devuelve `null`.
- Liberar `URL.revokeObjectURL` cuando el componente se destruya.
- No usar `$effect` para iniciar la compresión; hacerlo en el evento del usuario.

---

## 8. ¿Qué va a un worker y qué no?

| Tarea | Worker | Motivo |
|---|---|---|
| Comprimir/redimensionar imagen | Sí | CPU intensiva; 200–800 ms |
| Calcular SHA-256/dHash | Sí | CPU; evita bloquear scroll |
| Indexar texto de búsqueda | Sí | Si el corpus crece |
| Parsear CSV grande | Sí | CPU/memoria |
| Llamadas `fetch` | No | El navegador ya las hace async |
| Acceso a IndexedDB | No (preferible) | Compatibilidad y transacciones |
| Render de mapa | No | Necesita DOM/WebGL en el hilo principal |
| Cifrado de evidencia | Sí (si es intensivo) | `crypto.subtle` es async, pero el cifrado grande puede bloquear |

---

## 9. Pruebas

| Nivel | Herramienta | Qué probar |
|---|---|---|
| Unidad pura | Vitest (node) | `dHash`, `hamming`, cálculo de escala |
| Worker real | Vitest browser mode o Playwright | Mensajes, progreso, error, cancelación |
| Integración | Playwright | Subir foto, ver progreso, ver preview, enviar reporte |
| Rendimiento | Performance panel | La tarea no bloquea el hilo principal > 50 ms |

Ejemplo de prueba de contrato del worker:

```ts
test('responde done con dimensiones y hash', async () => {
  const worker = new Worker(new URL('./image.worker.ts', import.meta.url), { type: 'module' });
  const file = new File([new Uint8Array([/* ... */])], 'foto.jpg', { type: 'image/jpeg' });

  const result = await new Promise((resolve) => {
    worker.onmessage = (event) => {
      if (event.data.type === 'done') resolve(event.data);
    };
    worker.postMessage({ id: '1', type: 'compress', file, maxSize: 1600, quality: 0.78 });
  });

  expect(result).toMatchObject({ width: 1600 });
  worker.terminate();
});
```

---

## 10. Presupuesto de rendimiento

| Operación | Presupuesto | Si se excede |
|---|---|---|
| Comprimir 1 foto | ≤ 900 ms en gama media | Bajar a 1280 px o calidad 0.7 |
| dHash | ≤ 50 ms | Reducir a 8×8 con canvas pequeño |
| Transferencia al worker | ≤ 20 ms | Transferir buffer, no clonar |
| UI bloqueada | 0 ms > 50 ms | Mover a worker o dividir en chunks |

Medir en un Android real de gama baja, no solo en el portátil de desarrollo.

---

## 11. Checklist

- [ ] El worker se crea solo en cliente y se destruye al salir.
- [ ] La compresión aplica orientación EXIF y elimina metadatos.
- [ ] El peso final es ≤ 450 KB en el 90% de las fotos.
- [ ] El hash se calcula en worker y se valida en servidor.
- [ ] El pool no supera 2 workers en móvil.
- [ ] Hay fallback si `OffscreenCanvas` no existe.
- [ ] Las pruebas cubren éxito, error y cancelación.
- [ ] La UI muestra progreso y nunca se congela.
