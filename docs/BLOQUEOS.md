# Bloqueos

Registro de lo que impidió completar o verificar un paso.

## B1 · Node.js no estaba instalado — RESUELTO (2026-11-08)

- **Qué pasó:** no había `node`, `npm` ni `pnpm`, así que el proyecto nunca se había instalado (sin `node_modules/` ni `.svelte-kit/`). Por eso VS Code mostraba unos 20 errores de "Cannot find module".
- **Solución aplicada:** Node.js 26.13.0 LTS (`winget install OpenJS.NodeJS.LTS`), `npm install -g pnpm` (Node 26 ya no trae corepack) y `pnpm install --frozen-lockfile`.
- **Verificado:** `pnpm check` 0 errores, `pnpm test` 48/48, `pnpm build` ok, `pnpm dev` sin errores en el log.

## Cambios de SvelteKit 3 que causaban errores (corregidos)

El lockfile fija `@sveltejs/kit` 3.1.1. Algunas cosas cambiaron respecto de Kit 1 y 2:

| Antes | En Kit 3 | Dónde |
|---|---|---|
| `$app/environment` | `$app/env` (el original estaba bien; la revisión se equivocó y se revirtió) | `src/datos/almacen.ts` |
| `$service-worker` | `$app/manifest` + `version` de `$app/env` + `self` de `$app/service-worker` | `src/service-worker/index.ts` |
| `$lib/...` | `#lib/...` (definido en `imports` de `package.json`) | 3 imports |
| `adapter({ fallback })` | adapter-node 6 no tiene `fallback` | `vite.config.ts` |

También se quitó el `paths` de `$lib` del `tsconfig.json`: hacía pasar `pnpm check` aunque el build fallaba.

## Pendientes conocidos (no son bloqueos)

- Las listas de servicios, favores y alertas siguen leyendo de la API. Sin señal, lo publicado queda en la cola, pero no aparece en la lista hasta que se sincroniza.
- Una emergencia encolada fallaría con 401, porque el motor de sync no envía `X-Rol`. Hoy ninguna pantalla encola emergencias.
- `POST /api/v1/sync` sigue aceptando cualquier `payload` sin lista blanca.
- El cierre de favores confía en el `usuario_id` del body (no hay sesión real) hasta que exista `hooks.server.ts`.
- `src/service-worker/` está excluido del `tsconfig.json`, así que `pnpm check` no lo revisa (el build sí).
- Los tests muestran `ExperimentalWarning: localStorage is not available`: es un aviso de Node 26, no un error.
