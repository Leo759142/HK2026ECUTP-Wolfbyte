# Arquitectura `src/` (orden práctico)

`src/` ya actúa como raíz de infraestructura de la app (SvelteKit). La separación clave no es otra carpeta `infra/`, sino responsabilidades claras al mismo nivel lógico:

| Carpeta | Rol | Depende de |
|---|---|---|
| `dominio/` | Entidades, tipos, reglas, errores, contratos de repositorio (puertos) | Nada externo |
| `datos/` | **DAO local** + almacenamiento KV + outbox (acceso a persistencia, sin negocio) | tipos/dominio mínimo |
| `repositorios/` | **Implementaciones Repository** (adaptadores locales; HTTP futuros) | `datos/dao`, `dominio/repositorios`, dominio |
| `aplicacion/` | Casos de uso/orquestación (crear cuando haga falta) | dominio + puertos |
| `seguridad/` | Cipher/anonimización/anti-abuso | utilidades runtime |
| `sync/` | Motor de sincronización, fachadas legacy, backoff/idempotencia cliente | `datos`, accesibilidad |
| `rutas/` | UI + endpoints API (borde) | repositorios/casos de uso, no DB directa idealmente |
| `service-worker/` | Cache/offline del shell/assets | sin negocio |

## Trazabilidad rápida
- **RF17/RF18, CU12**: `datos/almacen.ts` (KV IndexedDB/memoria) → `datos/outbox.ts` → `datos/dao.ts` → `sync/motor.ts`/`sync/api.ts`.
- **RF05–RF08**: `dominio/proximidad/*`, `dominio/repositorios` → `repositorios/servicio.local.ts`, `repositorios/recomendacion.local.ts`.
- **RF09–RF11, CU08**: `dominio/favores/cierre.ts` → `repositorios/favor.local.ts`.
- **RF12–RF15, RF19**: `repositorios/emergencia.local.ts`, `dominio/tipos/geohash.ts`, API enmascara coords aprox.
- **Cipher (RNF-SEC)**: `seguridad/cipher.ts` (WebCrypto AES-GCM) + `seguridad/cifradolocalmejora.ts` compat.

## Pendiente real
- SQLite WASM + OPFS en Web Worker (reemplazo/fallback robusto del KV actual).
- Hooks server (`hooks.server.ts`), auth/RBAC enforcement, rate limit.
- Repositorios HTTP/server Postgres detrás de los mismos contratos.
- Políticas de sync por entidad (`sync_politicas`) y conflictos UI.