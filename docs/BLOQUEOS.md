# Bloqueos

Registro de lo que impidió completar o verificar un paso. Fecha: 2026-11-08.

## B1 · Node.js no está instalado en la máquina de desarrollo

- **Qué pasó:** `pnpm`, `npm` y `node` no existen en el PATH ni en las rutas habituales (`C:\Program Files\nodejs`, `%APPDATA%\npm`, `%LOCALAPPDATA%\pnpm`, nvm, volta, scoop).
- **Impacto:** no se pudo correr `pnpm install`, `pnpm test` ni `pnpm dev` en ninguno de los pasos 1–5. Los cambios y tests están escritos pero **sin ejecutar**.
- **Cómo destrabar:**
  ```powershell
  winget install OpenJS.NodeJS.LTS
  corepack enable
  pnpm install
  pnpm test
  pnpm check
  pnpm dev
  ```
- **Qué revisar primero al poder correrlo:** `pnpm check` (tipos de `./$types` en los `+server.ts`) y `pnpm test`.
- **Tests nuevos, sin ejecutar todavía:**
  - `src/routes/api/store.test.ts` (paso 1)
  - `src/routes/api/favores.test.ts` (paso 2)
  - `src/routes/api/seguridad.test.ts` (paso 3)
  - `src/lib/publicar.test.ts` (paso 4)
  - `src/sync/motor.test.ts` (paso 5). El test del temporizador usa fake timers; si falla, es el primer sospechoso.

## Pendientes conocidos (no son bloqueos, quedan fuera de estos 5 pasos)

- Las listas de servicios, favores y alertas siguen leyendo de la API. Sin señal, lo publicado queda en la cola, pero no aparece en la lista hasta que se sincroniza.
- Una emergencia encolada fallaría con 401, porque el motor de sync no envía `X-Rol`. Hoy ninguna pantalla encola emergencias.
- `POST /api/v1/sync` sigue aceptando cualquier `payload` sin lista blanca. No lo usa la app, pero queda expuesto en Swagger.
- El cierre de favores confía en el `usuario_id` del body (no hay sesión real). Valida que coincida con el rol, pero se puede suplantar hasta que exista `hooks.server.ts`.
