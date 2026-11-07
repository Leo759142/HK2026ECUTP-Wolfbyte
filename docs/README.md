# Cuadra — Documentación técnica y de producto

> **Estado:** documentación base v0.1 · **Fecha:** 2026-11-06
> **Alcance:** revisión del repositorio actual y diseño de la base para implementar una PWA de incidencias urbanas con SvelteKit 3.
> **Naturaleza:** este paquete **no modifica código**. Es un contrato de trabajo: diagnóstico, arquitectura, decisiones, criterios de aceptación y backlog.

---

## 1. Qué es Cuadra

Cuadra es el nombre de trabajo de una **PWA ciudadana para reportar y dar seguimiento a incidencias de la vía y los servicios urbanos** (baches, basura, alumbrado, agua, transporte, espacios públicos), con un panel para operadores municipales y una API pública documentada con OpenAPI.

La hipótesis central no es "hacer otra app de denuncias", sino resolver tres fricciones que la evidencia peruana muestra una y otra vez:

1. **Reportar es caro en tiempo y confianza.** El ciudadano no sabe a quién, por qué canal, ni si quedará registro.
2. **Seguir es imposible.** No hay número de caso, estado, plazo ni responsable visible.
3. **Priorizar es opaco.** La municipalidad no tiene una cola única, geolocalizada y comparable para decidir cuadrillas.

El detalle del problema, con fuentes de El Comercio, está en [01-problema-y-producto.md](01-problema-y-producto.md).

---

## 2. Cómo leer esta documentación

| Si eres… | Empieza por | Luego |
|---|---|---|
| Desarrollador/a que implementa | [00-diagnostico-tecnico.md](00-diagnostico-tecnico.md) | 02, 03, 06, 07 |
| QA / testing | [09-testing.md](09-testing.md) | 04, 08 |
| Producto / PO | [01-problema-y-producto.md](01-problema-y-producto.md) | 13, 11 |
| Arquitectura / tech lead | [02-arquitectura.md](02-arquitectura.md) | 08, 10, 12, ADRs |
| Seguridad / legal | [10-seguridad-privacidad.md](10-seguridad-privacidad.md) | 07, 08 |
| Operación / SRE | [12-operacion-ci-cd.md](12-operacion-ci-cd.md) | 04, 08 |

Orden recomendado de lectura completa:

1. [00-diagnostico-tecnico.md](00-diagnostico-tecnico.md) — qué hay hoy y qué falta.
2. [01-problema-y-producto.md](01-problema-y-producto.md) — por qué se construye.
3. [02-arquitectura.md](02-arquitectura.md) — cómo se organiza.
4. [03-sveltekit-3.md](03-sveltekit-3.md) — el framework con las APIs de la versión instalada.
5. [04-pwa-offline.md](04-pwa-offline.md) → [05-workers.md](05-workers.md) → [06-repositorios-y-datos.md](06-repositorios-y-datos.md) — el núcleo offline.
6. [07-hooks-y-seguridad.md](07-hooks-y-seguridad.md) → [08-api-openapi-swagger.md](08-api-openapi-swagger.md) — borde y contrato.
7. [09-testing.md](09-testing.md) → [10-seguridad-privacidad.md](10-seguridad-privacidad.md) → [11-accesibilidad-rendimiento.md](11-accesibilidad-rendimiento.md) — calidad.
8. [12-operacion-ci-cd.md](12-operacion-ci-cd.md) → [13-roadmap-backlog.md](13-roadmap-backlog.md) — entrega.
9. [14-referencias.md](14-referencias.md) — fuentes y enlaces oficiales.

---

## 3. Snapshot técnico verificado

Estas son las versiones **realmente resueltas** en `node_modules` al momento de la revisión (no solo los rangos de `package.json`).

| Componente | Versión resuelta | Nota |
|---|---:|---|
| `@sveltejs/kit` | 3.1.1 | SvelteKit 3: configuración en `vite.config.ts`, sin `svelte.config.js` |
| `svelte` | 5.57.3 | Runes (`$state`, `$derived`, `$props`, `$effect`) |
| `vite` | 8.3.6 | Rolldown estable |
| `vitest` | 4.1.12 | Proyecto `server` ya configurado |
| `typescript` | 6.0.3 | Requisito mínimo de SvelteKit 3 |
| `tailwindcss` | 4.3.4 | Plugin `@tailwindcss/vite` |
| `eslint` | 10.14.0 | Flat config |
| Gestor | pnpm | `pnpm-lock.yaml`; scripts internos usan `npm run` |

Rutas y piezas existentes: `/`, `/about`, `/dashboard`, `/settings`, `/users`, `/sverdle` (demo), un kit de 16 componentes en `src/lib/components`, alias `#lib`, y un único test de ejemplo (`src/lib/vitest-examples/greet.spec.ts`).

---

## 4. Estado actual en una frase

El repositorio es un **scaffold funcional de SvelteKit 3 con un kit de UI**, pero **todavía no es una PWA ni una aplicación**: no carga Tailwind, no tiene capa de datos, no tiene API, no tiene hooks, no tiene service worker, no tiene pruebas representativas y conserva rutas de demostración en el build.

Los cinco hallazgos que bloquean cualquier demo creíble están en [00-diagnostico-tecnico.md](00-diagnostico-tecnico.md#5-hallazgos-priorizados):

| ID | Severidad | Hallazgo |
|---|---|---|
| D-01 | P0 | `src/routes/layout.css` existe pero **no se importa**: Tailwind no se aplica. |
| D-02 | P0 | No existe capa de API ni contrato OpenAPI. |
| D-03 | P1 | No existe PWA: sin manifest, iconos, service worker ni estrategia offline. |
| D-04 | P1 | No hay pruebas de dominio, componentes ni e2e; el único test es un saludo. |
| D-05 | P1 | No hay hooks ni sesión: no se puede autenticar, autorizar ni auditar. |

---

## 5. Decisiones estructurantes (resumen)

| Decisión | Elección | ADR |
|---|---|---|
| Estrategia de entrega | PWA offline-first, no app nativa | [ADR-0001](adr/ADR-0001-pwa-offline-first.md) |
| Capa de datos | Puertos y adaptadores + repositorios | [ADR-0002](adr/ADR-0002-repositorios-puertos-adaptadores.md) |
| Procesamiento de evidencia | Web Workers en el cliente | [ADR-0003](adr/ADR-0003-workers-procesamiento-local.md) |
| Contrato de API | OpenAPI 3.1 contract-first + Swagger UI | [ADR-0004](adr/ADR-0004-openapi-contrato-primero.md) |
| Despliegue | `adapter-node` + PostgreSQL/PostGIS + S3 | [ADR-0005](adr/ADR-0005-adapter-node-postgres.md) |

---

## 6. Convenciones de esta documentación

- **Verificado**: se comprobó en el repositorio o en documentación oficial; se cita el archivo o enlace.
- **Decisión**: se adopta como regla del proyecto; si cambia, se actualiza el ADR.
- **Propuesta**: diseño recomendado, aún no implementado.
- **Pendiente**: requiere validación con el equipo, un municipio o una medición.

Los ejemplos de código son **ilustrativos y ejecutables en su mayoría**, pero no se han añadido al repositorio. Cuando un ejemplo depende de una librería que aún no está instalada, se indica el comando de instalación.

### Reglas de mantenimiento

1. Todo cambio de arquitectura o de contrato de API requiere un ADR nuevo o una enmienda.
2. Todo PR que cambie comportamiento debe actualizar el documento correspondiente en el mismo PR.
3. Los enlaces a documentación oficial se revisan en cada actualización menor de SvelteKit.
4. Las cifras periodísticas se citan con fecha y URL; no se usan como dato operativo interno.

---

## 7. Próximos pasos (orden de ejecución)

| # | Acción | Dueño | Criterio de salida |
|---|---|---|---|
| 1 | Importar Tailwind en `src/routes/+layout.svelte` y retirar el CSS demo | Frontend | `pnpm dev` muestra el kit con estilos |
| 2 | Crear `src/env.ts`, `src/app.d.ts` y `src/hooks.server.ts` base | Backend | `pnpm check` sin errores; locales tipados |
| 3 | Crear `src/service-worker/index.ts` + manifest + iconos | Frontend | Lighthouse PWA instalable |
| 4 | Implementar dominio + repositorios + outbox | Full-stack | Reporte creado offline y sincronizado |
| 5 | Publicar `openapi/openapi.yaml` y `/api/v1/incidents` | Backend | Swagger UI y contract tests en CI |
| 6 | Añadir Vitest (unit/component) y Playwright (e2e offline) | QA | Pipeline verde con umbral de cobertura |
| 7 | Endurecer seguridad y privacidad (Ley 29733) | Seguridad | Checklist de [10-seguridad-privacidad.md](10-seguridad-privacidad.md) completo |

El detalle secuencial, con historias y criterios de aceptación, está en [13-roadmap-backlog.md](13-roadmap-backlog.md).
