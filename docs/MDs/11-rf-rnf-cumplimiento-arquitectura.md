# 11 · Cumplimiento RF/RNF, CU/HU y arquitectura objetivo

> **Propósito:** ordenar qué falta para cumplir los requisitos funcionales (RF01–RF25), requisitos no funcionales (RNF), casos de uso (CU01–CU14) e historias de usuario (HU01–HU15), y definir cómo encajan DAO, Repository (puertos/adaptadores), patrones de arquitectura, workers (Service Worker + Web Worker) y cipher/crypto.
>
> **Alcance:** diagnóstico y plan técnico trazable al estado actual del repositorio. No modifica código.

## Fuentes

| Tipo | Ruta |
|---|---|
| Trazabilidad RF/CU/HU, subsistemas S1–S10, etiquetado funcional | `docs/MrMDs/HUCURFRNF.txt` |
| Contexto y decisiones | `docs/MrMDs/10factos.txt`, `docs/MrMDs/CF2_Plan.txt` |
| Esquemas de datos | `docs/MrMDs/schema_sqlite.sql`, `docs/MrMDs/schema_postgres.sql` |
| Contrato API | `static/api/openapi.yaml` |
| Gaps previos | `docs/MDs/09-rf-rnf-api-paginas.md`, `docs/MDs/10-faltantes-arquitectura.md` |
| Arquitectura/patrones | `docs/MDs/02-arquitectura.md`, `docs/MDs/04-pwa-offline.md`, `docs/MDs/05-workers.md`, `docs/MDs/06-repositorios-y-datos.md`, `docs/MDs/07-hooks-y-seguridad.md` |
| Plan maestro previo | `.kilo/plans/1794036538375-mrmds-requirements-plan.md` |

## Estado actual (evidencia)

| Área | Evidencia en repo | Estado |
|---|---|---|
| Dominio/tipos | `src/dominio/tipos/tipos.ts`, `src/dominio/index.ts`, agregados en `src/dominio/{roles,grupos,proximidad,favores,emergencia,confianza,anuncios}/**` | Parcial: modelos/reglas base; falta integración end-to-end |
| RBAC | `src/dominio/roles/rbac.ts` (permisos por rol/membresía) | Parcial: lógica de dominio; falta enforcement en `hooks.server.ts` y sesión |
| DAO local | `src/datos/dao.ts` | Stub: usa `localStorage` (`comunidad_sync_cola_v2`), sin SQLite/IndexedDB real, sin transacciones reales |
| Datos local (paquete zona) | `src/lib/datos/local.ts` | Stub: retorna vacío |
| Outbox/sync cliente | `src/sync/outbox.svelte.ts`, `src/sync/api.ts`, `src/sync/reproductor.ts`, `src/sync/soloagregar.ts` | Parcial/demo: dos mecanismos de cola (`dao` y `OutboxComunitario`), sin lock, sin estados completos, sin políticas por entidad aplicadas |
| Service Worker | `src/service-worker/index.ts` | Básico: precache shell + cache de navegación; ignora `/api/`; sin runtime caching avanzado ni coordinación robusta con outbox |
| Web Worker | *(no hay workers dedicados en `src/`)* | Faltante: no hay SQLite WASM worker, ni worker de compresión/hash |
| Cipher/crypto local | `src/seguridad/cifradolocalmejora.ts` | Stub inseguro para producción: empaqueta/desempaqueta en plaintext |
| Privacidad/geohash | `src/seguridad/anonimizador.ts` reexporta `src/dominio/tipos/geohash.ts` | Parcial: utilidades presentes; falta aplicar sistemáticamente en flujos y API |
| API v1 | `routes/api/v1/**`, `src/routes/api/_http.ts` | Stubs contrato-primero; falta persistencia/adaptadores servidor, auth/RBAC, idempotencia real, rate limit |
| OpenAPI | `static/api/openapi.yaml`, `/api/docs` | Parcial: contrato inicial; debe mantenerse alineado al comportamiento real |
| UI/páginas | `src/routes/**` | Parcial/demo: navegación y flujos base; falta conexión a repositorios/casos de uso reales, estados de error/carga/offline consistentes |
| Auth/sesión/hooks | *(no se observó `src/hooks.server.ts` implementado en fuentes leídas)* | Faltante/crítico para RBAC, rate limit, trazabilidad y protección de rutas/API |

## Glosario breve

| Término | Significado en este proyecto |
|---|---|
| **DAO** (Data Access Object) | Capa de acceso a almacenamiento local/remoto sin reglas de negocio. Expone operaciones CRUD/transacciones; lo consumen adaptadores/repositorios. |
| **Repository** | Contrato orientado al agregado que oculta el origen de datos (HTTP, SQLite, Dexie, memoria). La UI/casos de uso dependen del puerto, no del adaptador. |
| **Port/Adapter** (Hexagonal) | *Puerto*: interfaz definida por aplicación/dominio. *Adaptador*: implementación concreta (HTTP, SQLite WASM, Postgres, WebCrypto). |
| **Outbox** | Cola local de mutaciones pendientes. Garantiza que una acción creada offline se envíe luego con `op_id`/`Idempotency-Key` sin duplicar. |
| **Service Worker (SW)** | Worker del navegador/origen para shell cache, estrategias de recursos, offline y (opcional) Background Sync. No debe contener lógica de negocio. |
| **Web Worker** | Hilo dedicado para cómputo pesado o I/O aislado (SQLite WASM/OPFS, compresión, hash, parseo). Comunica por `postMessage` con mensajes tipados. |
| **Cipher / crypto** | Cifrado local con Web Crypto API (p. ej. AES-GCM) para PIN, tokens o datos sensibles en reposo. No usar plaintext en producción. |
| **Idempotencia** | Una operación con el mismo `op_id`/`Idempotency-Key` aplicada varias veces produce el mismo efecto lógico; clave para reintentos offline. |
| **Geohash / aproximación** | Representación/ajuste de ubicación a zona/manzana aproximada para privacidad (RF19, RNF privacidad); nunca exponer dirección exacta. |
| **LWW** (Last Write Wins) | Estrategia de conflicto: gana la escritura con marca temporal/versión más reciente (p. ej. perfil propio), con cuidado en relojes. |
| **Append-only** | Estrategia para eventos que solo se agregan (visto bueno/retiro, confirmaciones, reputación). Nunca se editan/borran como mutación normal. |

## Matriz RF → estado, faltante y componente responsable

| RF | Requisito (resumen) | Subsistema | Estado | Falta principal | Responsable (capa/componente) |
|---|---|---|---:|---|---|
| RF01 | Registro celular+alias, acceso rápido con PIN | S1 | Parcial | Flujo real de registro/login/PIN, persistencia usuario, sesión, validación, hash/cifrado PIN | UI auth + caso de uso + `UsuarioRepository` + DAO local + cipher + API/auth + hooks |
| RF02 | Unirse a grupo por zona o invitación WhatsApp | S2 | Parcial | Búsqueda de zona/grupo, solicitud de ingreso, enlace/invitación, estado pendiente | UI grupos + casos de uso + `GrupoRepository`/`MembresiaRepository` + API |
| RF03 | Roles como datos; permisos por rol | S1 | Parcial | `rbac.ts` existe; falta RBAC server-side, sesión con rol/membresía, guards en rutas/API | Dominio RBAC + `hooks.server.ts` + authz server + UI condicional |
| RF04 | Referente aprueba/modera/oculta contenido | S2/S6 | Pendiente | Solicitudes pendientes, acciones aprobar/rechazar/ocultar, registro de moderador, auditoría | Casos de uso moderación + repos + API + RBAC |
| RF05 | Publicar servicio/oficio en ≤3 pasos | S3 | Parcial | Flujo real conectado, validación, persistencia local/remota, categoría/zona, UX 3 pasos | UI publicar + `ServicioRepository` + outbox/sync + API |
| RF06 | Buscar servicios por categoría y zona | S3 | Parcial | Consulta real, filtros, paginación/cursor, datos locales/servidor, estados vacío/error | UI directorio + repos + API + índice local |
| RF07 | Dar Visto Bueno con comentario corto | S3/S6 | Parcial | Evento append-only real, validación comentario, autoría, misma zona/dispositivo hash | Dominio proximidad + repos append-only + outbox + API |
| RF08 | Etiqueta de verificación en Visto Bueno | S6 | Parcial | Derivar etiqueta (“vecino del grupo”, “tras favor cerrado”, “sin verificar”) desde datos | Dominio confianza + consultas/repos + UI |
| RF09 | Publicar favor en ≤3 pasos | S4 | Parcial | Flujo completo, validación tipo/categoría/zona, persistencia y sync | UI + `FavorRepository` + outbox + API |
| RF10 | Ofrecerse para un favor y acordar | S4 | Pendiente | Estado/relación ayudante, aceptación, notificación/visibilidad local, conflictos | Dominio favor + repos + API + sync |
| RF11 | Cerrar favor con confirmación mutua “Se cumplió” | S4/S6 | Parcial | `cierre.ts` existe; falta persistir confirmaciones por rol, UI mutua, transición a cerrado/agradecimiento | Dominio + `FavorConfirmacionRepository` + UI + API + outbox |
| RF12 | Activar modo emergencia (Coordinador) | S5 | Parcial | Acción protegida por rol, estado de emergencia por zona, propagación a UI | RBAC + caso de uso + `EmergenciaRepository` + API + store/layout |
| RF13 | Reportar necesidad en emergencia con ubicación aproximada | S5 | Parcial | Flujo 3 pasos, tipo/urgencia, geohash/anonimización obligatoria | UI + anonimización + repos + API + outbox |
| RF14 | Directorio de servicios/grupos de apoyo en emergencia | S5 | Pendiente | Consulta filtrada por zona/emergencia, puntos de apoyo verificados | UI emergencia + `PuntoApoyoRepository`/repos servicios + API |
| RF15 | Tablero ayuda humanitaria y recursos críticos compartibles | S5 | Parcial | Recursos críticos CRUD/eventos, tablero por zona, compartir/enlace, estados | UI + `RecursoCriticoRepository` + API + sync |
| RF16 | Sugerir alertas desde fuentes oficiales para confirmación | S5 | Pendiente | Ingesta server (`alertas_oficiales`), parser, estado propuesta→confirmada/descartada, UI coordinador | Server ingesta + repos + API/admin + notificaciones (futuro) |
| RF17 | Funcionar sin conexión: leer/publicar/colar y mostrar estado | S8 | Parcial | Persistencia local real, cola unificada, UI de estados por operación, lectura desde cache/DB local | DAO/SQLite+Dexie + repos locales + outbox + SW + UI |
| RF18 | Sincronizar cola sin duplicar datos | S8 | Parcial | Idempotencia real cliente/servidor, reintentos/backoff, locks, políticas por entidad, resolución básica conflictos | Sync engine + `Idempotency-Key` + API/sync + DB constraints |
| RF19 | Ocultar ubicación exacta (sector/manzana aproximada) | S9 | Parcial | Aplicar en todos los inputs/mapas/APIs; validar que no se persista exacta; UI consistente | Geohash/anonimizador + DTOs + repos + mapas/UI |
| RF20 | Limitar publicaciones de cuentas nuevas y permitir reportar abusos | S6/S9 | Pendiente | Rate limit, cooldown/umbrales, reportes de moderación, bloqueo, auditoría | Anti-abuso + hooks/rate limit + `ReporteModeracionRepository` + UI |
| RF21 | Mostrar anuncios locales etiquetados “Patrocinado” | S7 | Pendiente | Modelo/flujo de anuncios, aprobación, etiqueta visible, segmentación por zona | Dominio anuncios + repos + API + UI |
| RF22 | Suspender anuncios mientras haya emergencia activa | S7/S5 | Parcial | Regla existe en dominio; falta dato real de emergencia activa por zona y enforcement en consultas/UI | Caso de uso + repos emergencias/anuncios + UI/SW cache invalidation |
| RF23 | Tutorial inicial guiado, breve y repetible | S10 | Pendiente | Onboarding persistido localmente, repetible desde perfil/ajustes, accesible | UI + almacenamiento preferencias + i18n |
| RF24 | Español completo y selector con quechua en flujos críticos | S10 | Parcial | `src/i18n/` existe; falta cobertura ES/QU en flujos críticos, selector, formato, fallback | i18n + UI rutas críticas + copy |
| RF25 | Botones grandes, contraste alto, errores accionables | S10 | Parcial | Auditoría a11y sistemática, tokens/foco/aria-live consistentes, validación de formularios | UI componentes + `src/accesibilidad/**` + pruebas manuales/automatizadas |

## Matriz RNF → estado, faltante y componente responsable

| RNF | Descripción | Estado | Falta | Responsable |
|---|---|---:|---|---|
| RNF-OFF | Offline-first: crear/leer/encolar sin red, estados visibles | Parcial | DB local real, repos locales, cola unificada, SW/runtime cache maduro, UX estados | DAO/Repo local + Outbox + SW + UI |
| RNF-SYNC | Sincronización idempotente, reintentos con backoff, sin duplicados | Parcial | `op_id`/`Idempotency-Key` end-to-end, dedupe server, estados conflicto, lock | Sync engine + API + DB constraints |
| RNF-PRIV | Privacidad: ubicación aproximada, mínimos datos, sin dirección exacta | Parcial | Aplicación transversal geohash, revisión DTO/schema, no logs con PII/coords exactas | Anonimizador + repos/API + observabilidad |
| RNF-SEC | Seguridad: sesión, RBAC server-side, cifrado local, secretos seguros | Pendiente/Parcial | `hooks.server.ts`, auth, authz, rate limit, WebCrypto real, hardening headers/CSRF/CSP | Hooks/auth + cipher + API |
| RNF-A11Y | Accesibilidad: teclado, foco, aria, contraste, mensajes claros | Parcial | Cobertura en todas las páginas/formularios, pruebas con teclado/lector, responsive táctil | UI + accesibilidad + QA |
| RNF-MOD | Moderación y confianza: reportes, ocultamiento, etiquetas, anti-abuso | Parcial | Repos/flows de reportes, rate limit, etiquetas derivadas confiables | Dominio confianza/moderación + repos + hooks |
| RNF-PERF | Rendimiento percibido en gama baja/red inestable | Parcial | Evitar bloqueo UI, workers para cómputo pesado, paginación, cache local | Web Workers + SW + UI/consultas |
| RNF-MAINT | Mantenibilidad: separación por capas, contratos, pruebas | Parcial | Eliminar stubs, unificar outbox, tests de contrato/adaptadores, tipos consistentes | Arquitectura + CI/tests |

## Matriz CU/HU → flujo faltante

| CU | Actor | Resultado esperado | RF | HU relacionadas | Estado | Flujo faltante | Componentes a implementar/conectar |
|---|---|---|---|---|---:|---|---|
| CU01 | Vecino | Cuenta creada y unida a grupo | RF01, RF02 | HU01 | Pendiente | Registro, PIN, selección/búsqueda zona, solicitud de unión, estado pendiente | UI auth/grupo, `Auth/UsuarioRepository`, `Grupo/MembresiaRepository`, cipher, API auth, hooks sesión |
| CU02 | Referente | Aprobar/rechazar nuevo vecino | RF03, RF04 | HU02 | Pendiente | Bandeja solicitudes, acción con un toque, cambio de membresía, auditoría | RBAC server, UI moderación, caso de uso membresía, repos, API |
| CU03 | Emprendedor | Servicio visible en directorio | RF05 | HU03 | Parcial | Publicación ≤3 pasos conectada a datos reales y sync | UI publicar, `ServicioRepository`, validación dominio, outbox, API |
| CU04 | Vecino | Lista con Vistos Buenos y etiquetas | RF06, RF08 | HU04, HU15 | Parcial | Búsqueda real + agregación reputación/etiquetas + UI accesible | `ServicioRepository`, vistas/consultas recomendaciones, dominio confianza, UI |
| CU05 | Vecino | Visto Bueno registrado y etiquetado | RF07, RF08 | HU05 | Parcial | Formulario, append-only, etiqueta derivada, anti-abuso básico | Recomendación evento repo, outbox, API, UI |
| CU06 | Vecino | Favor abierto en muro | RF09 | HU06, HU15 | Parcial | Publicación ≤3 pasos real, estado “Abierto”, cola offline | `FavorRepository`, UI, outbox, API |
| CU07 | Vecino | Oferta visible y aceptable | RF10 | HU07 | Pendiente | Ofrecerse, notificar/mostrar al solicitante, aceptar ayudante, transición a acordado/en curso | Dominio favor, repos, API, UI, sync/conflictos |
| CU08 | Ambas partes | Favor “Cerrado y confirmado” | RF11 | HU08 | Parcial | Confirmación mutua por botón, persistencia por rol, verificación ambas partes, agradecimiento | `cierre.ts` + `FavorConfirmacionRepository`, UI, API, outbox |
| CU09 | Coordinador | Modo emergencia activo y anuncios pausados | RF12, RF22 | HU09 | Parcial | Activación protegida, flag por zona, UI global, ocultar anuncios | RBAC, `EmergenciaRepository`, `AnuncioRepository`/reglas, layout/store |
| CU10 | Vecino | Alerta en tablero con ubicación aproximada | RF13, RF19 | HU10 | Parcial | Formulario tipo/urgencia 3 pasos, anonimización obligatoria, persistencia/sync | UI, geohash, `AlertaRepository`, API, outbox |
| CU11 | Cualquiera | Directorio simple de ayuda activa | RF14, RF15 | HU11 | Pendiente | Agregar puntos de apoyo + recursos + grupos/servicios relevantes por zona/emergencia | UI emergencia, repos apoyo/recursos/emergencia, API |
| CU12 | Cualquiera | Acción en cola y luego confirmada | RF17, RF18 | HU12 | Parcial | Cola unificada, estados por mutación, replay idempotente, feedback accesible | Outbox, DAO/DB local, sync engine, SW, UI estados |
| CU13 | Referente | Contenido oculto/aprobado con registro | RF04, RF20 | HU13 | Pendiente | Reporte, revisión, ocultar/aprobar, registro de responsable | Moderación repos/casos de uso, RBAC, API, UI |
| CU14 | Anunciante | Anuncio etiquetado “Patrocinado” en zona | RF21 | HU14 | Pendiente | Alta/aprobación/pausa, etiqueta visible, filtro por zona/emergencia | `AnuncioRepository`, roles/permisos, API, UI |

## Arquitectura objetivo y orden

### Capas (hexagonal / ports & adapters)

| Capa | Ubicación sugerida | Responsabilidad | Puede depender de |
|---|---|---|---|
| Dominio | `src/dominio/` (evolucionar) | Entidades, VOs, reglas, errores, invariantes, políticas puras (RBAC, cierre, anonimización) | Nada de SvelteKit/HTTP/DB/UI |
| Aplicación | `src/aplicacion/` (crear) | Casos de uso, puertos (interfaces), orquestación, DTOs internos, políticas de transacción/sync | Dominio + puertos |
| Infraestructura | `src/infra/` (crear) | Adaptadores HTTP, SQLite WASM/OPFS, Dexie fallback, WebCrypto, SW helpers, server repos | Aplicación/puertos + libs externas |
| UI / rutas | `src/routes/`, `src/lib/components/` | Formularios, páginas, stores/runas, presentación, accesibilidad | Aplicación/casos de uso (no DB directa) |
| Borde servidor | `src/hooks.server.ts`, `src/routes/api/` | Sesión, authz, validación, rate limit, idempotencia, headers, observabilidad | Aplicación + infra servidor |

> Regla: la UI no importa DAO/SQL/`fetch` ad hoc para negocio; consume casos de uso o repositorios inyectados.

### Diagrama textual (flujo offline-first)

```text
Usuario
  └─ UI Svelte (formulario ≤3 pasos, accesible, i18n)
      └─ Caso de uso / Store
          ├─ Valida dominio + anonimiza coords (geohash/aprox)
          ├─ Cipher (WebCrypto) para PIN/token local si aplica
          └─ Repository (puerto)
              ├─ LocalRepository
              │   └─ DAO local
              │       └─ SQLite WASM (OPFS) vía Web Worker  [preferido]
              │           └─ fallback Dexie/IndexedDB       [compatibilidad]
              └─ Outbox (misma transacción lógica)
                  └─ estado: Pendiente de enviar / Enviando / Enviada / Rechazada / Conflicto

Service Worker
  ├─ precache shell/assets
  ├─ runtime cache (lecturas seguras)
  └─ no ejecuta negocio; puede ayudar a despertar sync (opcional)

Sync Engine (cliente)
  ├─ detecta online/foco/evento
  ├─ lock por pestaña (navigator.locks)
  ├─ toma operaciones pendientes ordenadas por política
  ├─ POST/PATCH /api/v1/* con Idempotency-Key = op_id
  └─ marca aplicada / reintenta backoff / conflicto

API SvelteKit / servidor
  ├─ hooks.server: requestId, sesión, RBAC, rate limit, headers
  ├─ valida DTO + idempotencia
  ├─ Server Repository (Postgres, schema_postgres.sql)
  └─ responde JSON/Problem Details
```

## Componentes transversales

### 1) DAO

**Rol:** acceso a almacenamiento local (y patrón equivalente server-side si se usa). No contiene reglas de negocio.

**Estado actual:** `src/datos/dao.ts` es stub sobre `localStorage`; `src/lib/datos/local.ts` retorna vacío.

**Falta:**
- DAO real para SQLite WASM (cliente) con transacciones, migraciones/versionado y consultas por entidad/índice.
- Fallback DAO/almacén Dexie/IndexedDB cuando OPFS/SQLite WASM no esté disponible.
- Unificar `dao.ts` (sync cola v2) y `OutboxComunitario` (outbox v1) en un solo mecanismo.
- Exponer operaciones atómicas: `aplicarLocal + encolar` en la misma transacción lógica.

**Reglas:**
- No guardar blobs grandes sin comprimir.
- No borrar operaciones de outbox antes de confirmación `aplicada`.
- Versionar esquema local y probar migraciones.

### 2) Repository (puertos y adaptadores)

**Rol:** contratos por agregado; permiten intercambiar HTTP/local/memoria sin tocar UI ni dominio.

**Estado actual:** no hay puertos/adaptadores formales; la UI y sync usan stubs directos.

**Puertos sugeridos (por agregado/subsistema):**
- `SesionRepository` / `UsuarioRepository` (S1).
- `ZonaRepository`, `GrupoRepository`, `MembresiaRepository` (S2).
- `ServicioRepository`, `RecomendacionEventoRepository` (S3/S6).
- `FavorRepository`, `FavorConfirmacionRepository` (S4).
- `EmergenciaRepository`, `PuntoApoyoRepository`, `AlertaRepository`, `RecursoCriticoRepository` (S5).
- `AnuncioRepository` (S7).
- `ReporteModeracionRepository`, `BloqueoRepository` (S6).
- `OutboxRepository` / `SyncRepository` (S8).
- `ReputacionRepository` (lectura/agregación, idealmente derivada).

**Adaptadores:**
- `Http*Repository`: usa `fetch` tipado, valida respuesta, maneja Problem Details, envía `Idempotency-Key`.
- `LocalSqlite*Repository` o `Local*Repository`: usa DAO/SQLite worker.
- `LocalDexie*Repository`: fallback.
- `Memory*Repository`: pruebas de contrato.

**Pruebas de contrato:** el mismo suite debe pasar para memoria, local y HTTP mock (MSW), como sugiere `docs/MDs/06-repositorios-y-datos.md`.

### 3) Patrones de arquitectura

| Patrón | Aplicación | Nota de cumplimiento |
|---|---|---|
| Hexagonal / Ports & Adapters | Dominio+aplicación definen puertos; infra implementa | Evita acoplar UI a `fetch`/`localStorage` |
| DAO | Acceso a SQLite/Dexie/Postgres | Sin reglas de negocio; transacciones |
| Repository | Contrato por agregado | DTO↔dominio en adaptador |
| Outbox | Mutaciones offline confiables | `op_id` generado una vez; idempotencia |
| Append-only (eventos) | Vistos buenos, confirmaciones, reputación | Alineado a `schema_sqlite.sql` y triggers |
| LWW (perfil) | Datos propios del usuario/configuración | Definir campo/version/updated_at; cuidado reloj |
| Server manda | Estados críticos/moderación/emergencia/anuncios | Coordinador/admin; no confiar en cliente |
| CQRS ligero (opcional) | Lecturas agregadas (reputación, etiquetas) | Calcular al leer/renderizar; simplifica MVP |

### 4) Outbox / Sync engine

**Estado actual:** `src/sync/api.ts` y `src/sync/outbox.svelte.ts` cubren parte del flujo; `dao.ts` tiene otra cola.

**Falta:**
- Modelo único de operación: `op_id`, `entidad`, `tipo/operacion`, `payload`, `idempotencyKey`, `estado`, `intentos`, `nextAttemptAt`, `creadoEn`, `error`.
- Estados completos: `pendiente`, `enviando/inflight`, `aplicada/done`, `rechazada/failed`, `conflicto`.
- Backoff exponencial con jitter; tope de intentos; errores 4xx no reintentables marcados.
- Orden por dependencias (p. ej. crear entidad antes que confirmación asociada).
- Lock con `navigator.locks` para evitar carreras entre pestañas.
- Políticas por entidad alineadas a `sync_politicas` (`append_only`, `ultima_escritura`, `primero_gana`, `servidor_manda`).
- Endpoint/API de sync real o escrituras idempotentes por recurso con dedupe en servidor.
- UI: “Pendiente de enviar”, “Enviando”, “Enviada”, “Requiere atención”.

### 5) Service Worker

**Estado actual:** `src/service-worker/index.ts` cachea shell y navega a `/` offline; ignora `/api/`.

**Falta:**
- Estrategia explícita por tipo: assets inmutables cache-first, shell/navigation network-first con fallback, datos/API normalmente network-first o stale-while-revalidate solo donde sea seguro.
- Versionado/limpieza de caches y manejo de actualización (prompt “nueva versión disponible”).
- No asumir Background Sync; usarlo solo como mejora.
- Coordinar con outbox en cliente al evento `online`/sync; el SW no debe ser dueño de negocio.
- Manifest PWA, iconos, metadatos instalables y verificación Lighthouse PWA.

### 6) Web Workers

**Estado actual:** no se observan workers dedicados de dominio/datos.

**Falta (prioridad):**
- **SQLite WASM + OPFS Worker**: acceso a DB local fuera del hilo principal; API de mensajes tipados; fallback si OPFS no disponible.
- **Worker de procesamiento** (según necesidad): compresión/hash de evidencia, parseo de paquetes de zona, cálculos agregados pesados.
- **Pool/lifecycle**: crear en cliente, reutilizar, terminar en destroy; no enviar proxies reactivos.

**Regla:** el hilo principal no hace cómputo pesado (>50 ms). La persistencia y transacciones sensibles se coordinan cuidadosamente (DB worker o capa probada).

### 7) Cipher / crypto

**Estado actual:** `src/seguridad/cifradolocalmejora.ts` es passthrough (plaintext).

**Falta:**
- Implementar cifrado real con Web Crypto API (AES-GCM) para secretos locales: PIN (o material derivado), tokens de sesión local si se guardan, datos sensibles cacheados.
- Gestión de clave: derivación (PBKDF2/Argon2 en servidor según diseño) o clave no extraíble almacenada/derivada con precaución; definir amenaza modelo (dispositivo compartido vs. solo at-rest).
- Nunca almacenar PIN en claro. Preferir verificación con hash seguro en servidor para auth remota; PIN local solo como conveniencia con protección apropiada.
- Migración: detectar datos antiguos/plaintext y reempaquetar o invalidar sesión local.
- No exponer secretos en logs, outbox serializado sin protección (si contiene datos sensibles), ni respuestas API.

### 8) Seguridad y hooks

**Falta crítica:** implementar `src/hooks.server.ts` (o equivalente) con:
- Contexto de request (`requestId`), logging estructurado sin PII.
- Sesión opaca (cookie HttpOnly/Secure/SameSite) y carga de actor/rol/membresías.
- RBAC/autorización en rutas protegidas, `load`, actions y endpoints API.
- Rate limit en auth y escrituras.
- Validación de `Idempotency-Key` en mutaciones.
- Cabeceras de seguridad/CSP coherentes con la app (ver `docs/MDs/07-hooks-y-seguridad.md`).
- `handleError` sanitizado.

### 9) Privacidad y anonimización

- Aplicar `GeohashAnonimizador`/`enmascararCoordenadas` (`src/dominio/tipos/geohash.ts`, `src/seguridad/anonimizador.ts`) en todos los flujos que capturan ubicación (servicio, favor, alerta, recurso).
- Rechazar o normalizar coordenadas exactas antes de persistir/enviar.
- Revisar `schema_sqlite.sql`, DTOs y OpenAPI: campos `lat_aprox/lng_aprox` o equivalente consistente.
- No publicar dirección exacta en UI, mapa público ni respuestas API.

### 10) Accesibilidad e i18n

- Completar ES en toda la app; QU en flujos críticos (RF24): inicio, publicar, emergencia, estados offline/error.
- Selector de idioma persistido y accesible.
- Botones ≥44–48 px táctiles, foco visible, contraste suficiente, labels, `aria-live` para estados de sync/emergencia, errores junto al campo con instrucción de corrección.
- Tutorial guiado repetible (RF23).

## Backlog priorizado

### P0 — Núcleo demostrable (RF/CU críticos)

| ID | Ítem | Dependencias | Cubre | Validación |
|---|---|---|---|---|
| P0-1 | Unificar outbox + DAO local real (SQLite/Dexie fallback) | Arquitectura base | RF17, RF18, CU12 | Crear offline, recargar, ver pendiente, reenviar sin duplicar |
| P0-2 | Repositorios/puertos mínimos + casos de uso | P0-1 | RF05,06,07,09,11 | UI usa repos; tests de contrato básicos |
| P0-3 | Auth/sesión simple + RBAC server-side | — | RF01, RF03 | Rutas/API protegidas; rol denegado responde 401/403 |
| P0-4 | Flujos CU03–CU08 conectados (servicio/favor/visto bueno/cierre mutuo) | P0-1,P0-2 | RF05–RF11 | ≤3 pasos donde aplica; cierre mutuo por botón |
| P0-5 | Privacidad geohash en todos los inputs | — | RF19 | No se envía/guarda coord exacta; mapa aproximado |
| P0-6 | Estados offline accesibles en UI | P0-1 | RF17, RF25 | `aria-live`, mensajes claros, error accionable |
| P0-7 | OpenAPI + API idempotente coherente | P0-2 | RF18 | `Idempotency-Key` requerido; dedupe observable |

### P1 — Robustez y alcance MVP

| ID | Ítem | Dependencias | Cubre | Validación |
|---|---|---|---|---|
| P1-1 | Service Worker maduro + manifest/iconos | P0-1 | RNF-OFF | Instalable; shell offline; actualización controlada |
| P1-2 | SQLite WASM/OPFS Web Worker | P0-1 | RNF-PERF, RNF-OFF | Operaciones DB no bloquean UI; fallback Dexie |
| P1-3 | Cipher WebCrypto real + migración | P0-3 | RNF-SEC | Datos sensibles no en plaintext; sesión local segura |
| P1-4 | Grupos/zonas/membresías + aprobación referente | P0-3 | RF02, RF04, CU01, CU02, CU13 | Solicitud→aprobación; moderación registrada |
| P1-5 | Emergencia completa (activar, alertas, tablero, apoyo) | P0-2,P0-3,P0-5 | RF12–RF15, CU09–CU11 | Coordinador activa; anuncios se pausan; coords aproximadas |
| P1-6 | Anti-abuso + reportes moderación | P0-3 | RF20 | Rate limit, reporte, ocultamiento, bloqueo básico |
| P1-7 | i18n ES/QU flujos críticos + tutorial repetible | P0-6 | RF23, RF24 | Selector funcional; onboarding repetible |

### P2 — Hoja de ruta

| ID | Ítem | Cubre | Nota |
|---|---|---|---|
| P2-1 | Anuncios locales + aprobación | RF21, RF22, CU14 | Etiqueta “Patrocinado”; pausa en emergencia |
| P2-2 | Ingesta alertas oficiales (INDECI/SENAMHI/IGP/municipio) | RF16 | Sistema propone; coordinador confirma |
| P2-3 | Push notifications (VAPID) | S5 | Requiere SW + backend + consentimiento |
| P2-4 | Postgres real + migraciones + deploy | RNF-MAINT | Alinear `schema_postgres.sql` con contrato |
| P2-5 | CRDT/merge avanzado donde haga falta | S8 | MVP: append-only + LWW + server manda |

## Riesgos y supuestos

| Riesgo/supuesto | Impacto | Mitigación |
|---|---|---|
| QR eliminado: cierre por confirmación mutua con botón | Cambio de UX/flujo frente a ideas previas | Mantener `favor_confirmaciones` append-only por rol; ambas partes deben confirmar (RF11/CU08) |
| CRDT simplificado (append-only + LWW + servidor manda) | Casos complejos de conflicto diferidos | Documentar políticas por entidad (`sync_politicas`) y UI de conflicto cuando aplique |
| `localStorage`/almacenamiento iOS puede purgarse | Pérdida de cola/datos locales | Migrar a SQLite/IndexedDB gestionado, avisar límites, servidor como verdad |
| Reloj del cliente incorrecto | Orden LWW/confusión temporal | Servidor asigna timestamps autoritativos para estados críticos; cliente guarda `created_at` local solo auxiliar |
| API actual son stubs | La UI puede “parecer” completa sin persistencia real | Priorizar repos/adaptadores y tests de contrato; feature flags/demo clara |
| `cifradolocalmejora.ts` en plaintext | Exposición de secretos locales | Reemplazar por WebCrypto antes de guardar PIN/tokens reales; migrar datos |
| Dos colas/sync parciales (`dao` y `OutboxComunitario`) | Duplicación/confusión de estados | Unificar en P0-1 |
| Esquemas SQLite/Postgres pueden divergir | Bugs de integración | Contrato OpenAPI + tipos compartidos + migraciones revisadas |

## Checklist de validación del documento

- [x] Cubre RF01–RF25 en matriz de requisitos.
- [x] Cubre RNF clave (offline, sync, privacidad, seguridad, accesibilidad, moderación, rendimiento, mantenibilidad).
- [x] Cubre CU01–CU14 y HU01–HU15 en matriz de flujos.
- [x] Explica **DAO** (rol, estado actual, faltantes).
- [x] Explica **Repository** y **puertos/adaptadores**.
- [x] Explica **patrones de arquitectura** (hexagonal, outbox, append-only, LWW, server manda, CQRS ligero).
- [x] Explica **Service Worker** y **Web Worker** (incl. SQLite WASM/OPFS).
- [x] Explica **cipher/crypto** (WebCrypto, reemplazo de stub plaintext).
- [x] Cita rutas reales del repositorio.
- [x] Ordena implementación por prioridades P0/P1/P2.
