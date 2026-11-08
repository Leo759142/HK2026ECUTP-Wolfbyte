# 06 · Repositorios, puertos y capa de datos

> **Objetivo:** que la lógica de negocio no sepa si los datos vienen de IndexedDB, de una API REST o de un mock en un test. Que se pueda reportar offline y sincronizar sin duplicar reglas.

---

## 1. Por qué repositorios (y no fetch suelto en componentes)

Sin repositorios:

```svelte
<!-- anti-patrón -->
<script>
  let incidents = $state([]);
  $effect(async () => {
    const res = await fetch('/api/v1/incidents');
    incidents = await res.json();
  });
</script>
```

Problemas: lógica de red en la vista, sin caché, sin offline, sin validación, imposible de testear sin navegador.

Con repositorios:

```ts
const repo = getIncidentRepository();
const incidents = await repo.list({ status: 'assigned' });
```

Beneficios:

- **Testeable:** se inyecta un adaptador en memoria.
- **Intercambiable:** HTTP en producción, IndexedDB offline, memoria en tests.
- **Validado:** el adaptador valida DTOs con Zod antes de devolver dominio.
- **Trazable:** un solo lugar para idempotencia, reintentos y errores.

---

## 2. Puertos (interfaces del dominio/aplicación)

```ts
// src/lib/application/ports/incident-repository.ts
import type { Incident, IncidentStatus, Category } from '$lib/domain/incidents/incident';
import type { Result } from '$lib/domain/shared/result';

export type IncidentQuery = {
  status?: IncidentStatus;
  category?: Category;
  bbox?: [number, number, number, number];
  cursor?: string;
  limit?: number;
};

export type Page<T> = {
  items: T[];
  nextCursor: string | null;
  total?: number;
};

export interface IncidentRepository {
  list(query: IncidentQuery): Promise<Page<Incident>>;
  getById(id: string): Promise<Incident | null>;
  getByCode(code: string): Promise<Incident | null>;
  create(input: NewIncident, options: { idempotencyKey: string }): Promise<Incident>;
  updateStatus(id: string, next: IncidentStatus, note?: string): Promise<Incident>;
  confirm(id: string, deviceHash: string): Promise<{ count: number }>;
  pendingCount(): Promise<number>;
  sync(): Promise<SyncReport>;
}

export type NewIncident = {
  category: Category;
  description: string;
  location: { lat: number; lng: number; accuracy?: number };
  severity: 'low' | 'medium' | 'high';
  evidence: EvidenceInput[];
  clientCreatedAt: string;
};

export type EvidenceInput = {
  blob: Blob;
  hash: string;
  width: number;
  height: number;
  kind: 'photo';
};

export type SyncReport = {
  pushed: number;
  failed: number;
  conflicts: number;
};
```

```ts
// src/lib/application/ports/clock.ts
export interface Clock {
  now(): Date;
}

// src/lib/application/ports/id-generator.ts
export interface IdGenerator {
  newId(): string;
}
```

> `Result<T>` es un tipo propio (`{ ok: true; value: T } | { ok: false; error: AppError }`) para no lanzar excepciones en el dominio.

---

## 3. Dominio: entidad y reglas

```ts
// src/lib/domain/incidents/incident.ts
export type IncidentStatus =
  | 'draft' | 'submitted' | 'triaged' | 'assigned'
  | 'in_progress' | 'resolved' | 'verified' | 'closed'
  | 'rejected' | 'merged' | 'cancelled' | 'discarded';

export type Category =
  | 'pistas' | 'basura' | 'alumbrado' | 'agua'
  | 'transporte' | 'espacios' | 'seguridad';

export type Incident = {
  id: string;
  code: string;
  category: Category;
  description: string;
  location: { lat: number; lng: number; accuracy?: number };
  severity: 'low' | 'medium' | 'high';
  status: IncidentStatus;
  confirmations: number;
  evidence: EvidenceRef[];
  createdAt: string;
  updatedAt: string;
  version: number;
};
```

Transiciones válidas en `src/lib/domain/incidents/status.ts`:

```ts
const TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  draft: ['submitted', 'discarded'],
  submitted: ['triaged', 'rejected', 'merged'],
  triaged: ['assigned', 'rejected', 'merged'],
  assigned: ['in_progress', 'cancelled'],
  in_progress: ['resolved', 'unresolved', 'cancelled'],
  resolved: ['verified', 'in_progress'],
  verified: ['closed'],
  closed: [],
  rejected: [],
  merged: [],
  cancelled: [],
  discarded: [],
  unresolved: ['in_progress', 'cancelled']
};

export function canTransition(from: IncidentStatus, to: IncidentStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: IncidentStatus, to: IncidentStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Transición inválida: ${from} → ${to}`);
  }
}
```

La UI puede deshabilitar botones, pero **el servidor siempre revalida**.

---

## 4. Adaptador HTTP

```ts
// src/lib/infra/http/incident-http-repository.ts
import type {
  IncidentRepository,
  IncidentQuery,
  NewIncident,
  Page,
  SyncReport
} from '$lib/application/ports/incident-repository';
import type { Incident, IncidentStatus } from '$lib/domain/incidents/incident';
import { incidentDtoSchema, toDomain } from './incident-dto';

export class HttpIncidentRepository implements IncidentRepository {
  constructor(private baseUrl: string, private fetchFn: typeof fetch = fetch) {}

  async list(query: IncidentQuery): Promise<Page<Incident>> {
    const params = new URLSearchParams();
    if (query.status) params.set('status', query.status);
    if (query.category) params.set('category', query.category);
    if (query.bbox) params.set('bbox', query.bbox.join(','));
    if (query.cursor) params.set('cursor', query.cursor);
    params.set('limit', String(query.limit ?? 20));

    const res = await this.fetchFn(`${this.baseUrl}/incidents?${params}`, {
      headers: { accept: 'application/json' }
    });
    if (!res.ok) throw await toApiError(res);

    const json = await res.json();
    return {
      items: json.items.map((item: unknown) => toDomain(incidentDtoSchema.parse(item))),
      nextCursor: json.nextCursor ?? null,
      total: json.total
    };
  }

  async create(input: NewIncident, options: { idempotencyKey: string }): Promise<Incident> {
    const res = await this.fetchFn(`${this.baseUrl}/incidents`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': options.idempotencyKey
      },
      body: JSON.stringify(toDto(input))
    });

    if (res.status === 409) {
      // Duplicado: el servidor devuelve el caso existente
      const existing = await res.json();
      return toDomain(incidentDtoSchema.parse(existing.incident));
    }
    if (!res.ok) throw await toApiError(res);

    return toDomain(incidentDtoSchema.parse(await res.json()));
  }

  async updateStatus(id: string, next: IncidentStatus, note?: string): Promise<Incident> {
    const res = await this.fetchFn(`${this.baseUrl}/incidents/${id}/status`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: next, note })
    });
    if (!res.ok) throw await toApiError(res);
    return toDomain(incidentDtoSchema.parse(await res.json()));
  }

  async getById(id: string) { /* ... */ }
  async getByCode(code: string) { /* ... */ }
  async confirm(id: string, deviceHash: string) { /* ... */ }
  async pendingCount() { return 0; }
  async sync(): Promise<SyncReport> { return { pushed: 0, failed: 0, conflicts: 0 }; }
}
```

### Mapeo DTO ↔ dominio

- El DTO refleja el contrato OpenAPI (snake_case o camelCase, pero **uno solo**).
- `toDomain` convierte fechas ISO a `Date` si el dominio lo requiere y valida enums.
- Nunca exponer el DTO en componentes: siempre dominio.
- Si el backend cambia un campo, el test de contrato falla antes que la UI.

---

## 5. Adaptador IndexedDB

### 5.1 Esquema

```ts
// src/lib/infra/idb/db.ts
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Incident } from '$lib/domain/incidents/incident';
import type { OutboxOp } from './outbox';

interface CuadraDB extends DBSchema {
  incidents: {
    key: string;
    value: Incident & { syncState: 'local' | 'synced' | 'conflict' };
    indexes: { 'by-code': string; 'by-status': string; 'by-updated': string };
  };
  evidence: {
    key: string;
    value: { id: string; incidentId: string; blob: Blob; hash: string; createdAt: string };
    indexes: { 'by-incident': string };
  };
  outbox: {
    key: string;
    value: OutboxOp;
    indexes: { 'by-state': string; 'by-created': number };
  };
  categories: {
    key: string;
    value: { id: string; slug: string; name: string; slaHours: number };
  };
}

let dbPromise: Promise<IDBPDatabase<CuadraDB>> | null = null;

export function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<CuadraDB>('cuadra', 1, {
      upgrade(db) {
        const incidents = db.createObjectStore('incidents', { keyPath: 'id' });
        incidents.createIndex('by-code', 'code', { unique: true });
        incidents.createIndex('by-status', 'status');
        incidents.createIndex('by-updated', 'updatedAt');

        const evidence = db.createObjectStore('evidence', { keyPath: 'id' });
        evidence.createIndex('by-incident', 'incidentId');

        const outbox = db.createObjectStore('outbox', { keyPath: 'id' });
        outbox.createIndex('by-state', 'state');
        outbox.createIndex('by-created', 'createdAt');

        db.createObjectStore('categories', { keyPath: 'id' });
      }
    });
  }
  return dbPromise;
}
```

### 5.2 Repositorio local

```ts
// src/lib/infra/idb/incident-idb-repository.ts
import type { IncidentRepository, IncidentQuery, NewIncident, Page, SyncReport } from '$lib/application/ports/incident-repository';
import type { Incident, IncidentStatus } from '$lib/domain/incidents/incident';
import { getDb } from './db';
import { enqueue } from './outbox';

export class IdbIncidentRepository implements IncidentRepository {
  async list(query: IncidentQuery): Promise<Page<Incident>> {
    const db = await getDb();
    let items = await db.getAll('incidents');

    if (query.status) items = items.filter((i) => i.status === query.status);
    if (query.category) items = items.filter((i) => i.category === query.category);
    items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    const start = query.cursor ? Number(query.cursor) : 0;
    const limit = query.limit ?? 20;
    const page = items.slice(start, start + limit);

    return {
      items: page,
      nextCursor: start + limit < items.length ? String(start + limit) : null
    };
  }

  async getById(id: string) {
    return (await (await getDb()).get('incidents', id)) ?? null;
  }

  async getByCode(code: string) {
    return (await (await getDb()).getFromIndex('incidents', 'by-code', code)) ?? null;
  }

  async create(input: NewIncident, options: { idempotencyKey: string }): Promise<Incident> {
    const db = await getDb();
    const now = new Date().toISOString();
    const incident: Incident = {
      id: crypto.randomUUID(),
      code: makeLocalCode(),
      category: input.category,
      description: input.description,
      location: input.location,
      severity: input.severity,
      status: 'draft',
      confirmations: 0,
      evidence: [],
      createdAt: now,
      updatedAt: now,
      version: 1
    };

    const tx = db.transaction(['incidents', 'evidence', 'outbox'], 'readwrite');
    await tx.objectStore('incidents').put({ ...incident, syncState: 'local' });

    for (const [index, item] of input.evidence.entries()) {
      const evidenceId = `${incident.id}-${index}`;
      await tx.objectStore('evidence').put({
        id: evidenceId,
        incidentId: incident.id,
        blob: item.blob,
        hash: item.hash,
        createdAt: now
      });
    }

    await enqueue(tx, {
      id: crypto.randomUUID(),
      type: 'create-incident',
      payload: { incident, evidence: input.evidence.map((e) => e.hash) },
      idempotencyKey: options.idempotencyKey,
      attempts: 0,
      nextAttemptAt: Date.now(),
      state: 'pending',
      createdAt: Date.now()
    });

    await tx.done;
    return incident;
  }

  async updateStatus(id: string, next: IncidentStatus, note?: string) {
    const db = await getDb();
    const current = await db.get('incidents', id);
    if (!current) throw new Error('Incidencia no encontrada');

    const updated = { ...current, status: next, updatedAt: new Date().toISOString(), version: current.version + 1 };
    await db.put('incidents', updated);
    return updated;
  }

  async confirm(id: string, deviceHash: string) {
    const db = await getDb();
    const current = await db.get('incidents', id);
    if (!current) throw new Error('Incidencia no encontrada');
    const next = { ...current, confirmations: current.confirmations + 1, version: current.version + 1 };
    await db.put('incidents', next);
    return { count: next.confirmations };
  }

  async pendingCount() {
    const db = await getDb();
    return (await db.getAllFromIndex('outbox', 'by-state', 'pending')).length;
  }

  async sync(): Promise<SyncReport> {
    // Delegado al SyncEngine; el repositorio no hace red
    return { pushed: 0, failed: 0, conflicts: 0 };
  }
}
```

### 5.3 Reglas de IndexedDB

- Abrir una sola conexión y reutilizarla.
- Usar transacciones para operaciones que tocan varias tiendas.
- No guardar blobs enormes sin comprimir.
- No borrar `outbox` antes de confirmar `done`.
- Versionar el esquema (`upgrade`) y probar migraciones con datos reales.
- En iOS, asumir que el almacenamiento puede purgarse; el servidor es la verdad.

---

## 6. Outbox y motor de sincronización

```ts
// src/lib/infra/idb/outbox.ts
import type { IDBPTransaction } from 'idb';
import type { OutboxOp } from './types';

export async function enqueue(
  tx: IDBPTransaction<any, any, 'readwrite'>,
  op: OutboxOp
): Promise<void> {
  await tx.objectStore('outbox').put(op);
}

export async function takeNext(limit = 1): Promise<OutboxOp[]> {
  const db = await getDb();
  const all = await db.getAllFromIndex('outbox', 'by-created');
  return all
    .filter((op) => (op.state === 'pending' || op.state === 'inflight') && op.nextAttemptAt <= Date.now())
    .slice(0, limit);
}
```

```ts
// src/lib/application/sync-outbox.ts
import type { IncidentRepository } from './ports/incident-repository';

export class SyncEngine {
  private running = false;

  constructor(private repo: IncidentRepository, private online: () => boolean) {}

  async run(): Promise<void> {
    if (this.running || !this.online()) return;
    this.running = true;
    try {
      let op = await takeNext();
      while (op.length) {
        for (const item of op) {
          try {
            await this.repo.push(item); // implementado por el adaptador
            await markDone(item.id);
          } catch (error) {
            await markFailed(item, error);
          }
        }
        op = await takeNext();
      }
    } finally {
      this.running = false;
    }
  }
}
```

Estados de una operación:

```text
pending ──▶ inflight ──▶ done
               │
               ├──▶ retry (vuelve a pending con nextAttemptAt)
               ├──▶ failed (máximo de intentos)
               └──▶ conflict (409; requiere decisión)
```

Reglas:

1. **Una sola instancia** del motor por pestaña; usar `navigator.locks.request('cuadra-sync', ...)` para evitar carreras entre pestañas.
2. **Orden por tipo:** primero `create-incident`, luego `upload-evidence`, luego `confirm-incident`.
3. **Idempotencia:** la clave se genera una vez y se guarda en la operación.
4. **Errores 4xx no reintentables:** `failed` inmediato, con mensaje para el usuario.
5. **Errores 5xx/red:** reintento con backoff.
6. **Conflicto 409:** no sobrescribir; mostrar comparación y decidir.

---

## 7. Tests de contrato entre adaptadores

El mismo conjunto de pruebas debe correr contra memoria, IndexedDB y HTTP (con MSW). Así se garantiza que los adaptadores se comportan igual.

```ts
// src/lib/infra/__tests__/incident-repository.contract.ts
import { describe, it, expect, beforeEach } from 'vitest';
import type { IncidentRepository } from '$lib/application/ports/incident-repository';

export function incidentRepositoryContract(
  name: string,
  createRepo: () => Promise<IncidentRepository>
) {
  describe(`${name} cumple el contrato`, () => {
    let repo: IncidentRepository;

    beforeEach(async () => {
      repo = await createRepo();
    });

    it('crea y recupera por código', async () => {
      const created = await repo.create(baseInput(), { idempotencyKey: 'k1' });
      const found = await repo.getByCode(created.code);
      expect(found?.id).toBe(created.id);
    });

    it('no duplica con la misma idempotency key', async () => {
      const a = await repo.create(baseInput(), { idempotencyKey: 'same' });
      const b = await repo.create(baseInput(), { idempotencyKey: 'same' });
      expect(b.id).toBe(a.id);
    });

    it('rechaza una transición inválida', async () => {
      const created = await repo.create(baseInput(), { idempotencyKey: 'k2' });
      await expect(repo.updateStatus(created.id, 'closed')).rejects.toThrow();
    });
  });
}
```

---

## 8. Repositorio de servidor (PostgreSQL)

```ts
// src/lib/infra/server/incident-postgres-repository.ts
import { sql } from 'drizzle-orm';
import { db } from './db';
import { incidents, statusEvents } from './schema';

export async function listIncidents(query: {
  status?: string;
  category?: string;
  bbox?: [number, number, number, number];
  cursor?: string;
  limit: number;
}) {
  const conditions = [];
  if (query.status) conditions.push(sql`${incidents.status} = ${query.status}`);
  if (query.category) conditions.push(sql`${incidents.category} = ${query.category}`);
  if (query.bbox) {
    const [minLng, minLat, maxLng, maxLat] = query.bbox;
    conditions.push(sql`ST_Within(${incidents.location}, ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326))`);
  }
  // ...cursor, order, limit
}
```

Reglas del adaptador servidor:

- Toda consulta filtra por `district_id` del actor (multi-tenant).
- Los reportes `sensitive = true` no salen por endpoints públicos.
- `status_events` es append-only; nunca `UPDATE` ni `DELETE`.
- Los cambios de estado usan transacción + `SELECT ... FOR UPDATE` para evitar carreras.
- Las evidencias se suben a S3 antes de confirmar la transacción; si falla la transacción, se borra el objeto huérfano por job.

---

## 9. Antipatrones prohibidos

| Antipatrón | Por qué duele | Alternativa |
|---|---|---|
| `fetch` dentro de componentes | Sin caché, sin offline, sin tests | Repositorio + caso de uso |
| Guardar DTOs en `$state` global | Se mezcla contrato con UI | Mapear a dominio |
| Lógica de negocio en `+page.server.ts` | No se reutiliza ni se testea | Caso de uso en `application/` |
| `localStorage` para blobs | Límite 5 MB, bloquea el hilo | IndexedDB |
| Reintentar `POST` sin idempotencia | Duplica reportes | `Idempotency-Key` |
| Borrar outbox al enviar | Se pierde si falla la respuesta | Borrar solo tras `done` |
| Confiar en el reloj del cliente | Orden incorrecto | `created_at` del servidor |
| Un repositorio "todoterreno" | Difícil de testear | Puertos pequeños y específicos |

---

## 10. Checklist

- [ ] El dominio no importa SvelteKit, IndexedDB ni HTTP.
- [ ] Existe un puerto por agregado, no un repositorio genérico.
- [ ] HTTP e IDB implementan el mismo contrato y pasan las mismas pruebas.
- [ ] Las escrituras usan `Idempotency-Key`.
- [ ] El outbox sobrevive a recargas y cierres.
- [ ] Los conflictos se muestran, no se sobrescriben.
- [ ] Las migraciones de IndexedDB están probadas.
- [ ] Los blobs se comprimen antes de guardar.
