# 00 · Diagnóstico técnico del repositorio

> **Método:** revisión estática de archivos, versiones instaladas en `node_modules`, estado de Git y artefactos de build existentes. **No se ejecutó** `pnpm build`, `pnpm check` ni se modificó código de aplicación.
> **Fecha:** 2026-11-06 · **Commit base:** `ffbdfb8` ("Primer commit con mi codigo") · **Cambios sin commitear:** `src/lib/components/Layout.svelte`, `src/rutas/+layout.svelte`.

---

## 1. Inventario real del proyecto

```text
ProyectoOneDrive/
├─ src/
│  ├─ app.d.ts                  # namespace App vacío (sin Locals/PageData/Error)
│  ├─ app.html                  # lang="en", sin manifest ni theme-color
│  ├─ lib/
│  │  ├─ components/            # 16 componentes (Button, Card, Table, Modal…)
│  │  ├─ assets/favicon.svg     # duplicado de static/favicon.svg
│  │  ├─ images/                # logos demo
│  │  ├─ index.ts               # barrel de componentes y utilidades
│  │  ├─ stores.ts              # theme, sidebar, user, notifications (writable)
│  │  ├─ utils.ts               # cn, formatNumber, formatDate, debounce, truncate
│  │  └─ vitest-examples/       # greet.ts + greet.spec.ts (demo)
│  └─ rutas/
│     ├─ +layout.svelte         # monta Layout; NO importa layout.css
│     ├─ +page.svelte           # home demo
│     ├─ +page.ts
│     ├─ layout.css             # Tailwind + CSS demo (huérfano)
│     ├─ about/, dashboard/, settings/, users/
│     └─ sverdle/               # juego demo con form actions
├─ static/
│  ├─ favicon.svg
│  └─ robots.txt                # sin manifest.webmanifest ni iconos PWA
├─ vite.config.ts               # sveltekit({ adapter, compilerOptions }) + vitest
├─ tsconfig.json                # extends "$app/tsconfig"
├─ package.json                 # scripts dev/build/check/lint/test
└─ pnpm-lock.yaml
```

---

## 2. Stack y configuración verificada

| Elemento | Estado | Evidencia |
|---|---|---|
| SvelteKit 3.1.1 | Correcto | `node_modules/@sveltejs/kit/package.json` |
| Configuración en Vite | Correcto para v3 | `vite.config.ts` usa `sveltekit({ adapter, compilerOptions })`; no existe `svelte.config.js` |
| Runes forzadas | Correcto | `compilerOptions.runes` activa runes fuera de `node_modules` |
| Alias `#lib` | Correcto para v3 | `package.json#imports` y `tsconfig` (`$app/tsconfig`) |
| Tailwind 4 | **Instalado pero inactivo** | `layout.css` existe; ninguna importación lo referencia |
| Vitest 4 | Configurado solo servidor | `vite.config.ts#test.projects` con `environment: 'node'` |
| ESLint/Prettier | Configurados | `eslint.config.js`, `prettier.config.js` |
| Adapter | `adapter-auto` | No define destino de despliegue |
| PWA | Ausente | No hay `src/service-worker/`, manifest ni iconos |
| API | Ausente | No hay `src/rutas/api/` ni `openapi/` |
| Hooks | Ausentes | No hay `src/hooks.server.ts` ni `src/hooks.client.ts` |

---

## 3. Lo que ya está bien

1. **Base moderna y coherente:** SvelteKit 3 + Svelte 5 + Vite 8 + TypeScript 6 + Tailwind 4, con versiones compatibles entre sí.
2. **Tipado estricto:** `strict: true` y `svelte-check` en el script `check`.
3. **Calidad de formato:** Prettier con plugin de Tailwind y ESLint flat config con reglas de Svelte.
4. **Kit de UI reutilizable:** 16 componentes con variantes, snippets y clases Tailwind; sirve como base del design system.
5. **Estructura de rutas limpia:** separación por página y uso de `$props()`/snippets, sin stores globales innecesarios en los componentes.
6. **Un test ejecutable:** existe al menos un ejemplo de Vitest con `requireAssertions: true`, lo que evita tests vacíos.

---

## 4. Brechas por área

| Área | Estado | Qué falta para ser "producto" |
|---|---|---|
| Estilos | Roto | Importar Tailwind y eliminar el CSS demo global |
| Dominio | Inexistente | Entidades, estados, reglas, validación |
| Datos | Inexistente | Repositorios, IndexedDB, API, migraciones |
| Offline | Inexistente | Service worker, outbox, reintentos, conflictos |
| API | Inexistente | Endpoints, OpenAPI, errores, paginación |
| Sesión | Inexistente | Cookies, roles, RBAC, auditoría |
| Pruebas | Simbólico | Unitarias, componentes, contrato, e2e offline |
| Accesibilidad | Parcial | Navegación por teclado, foco, contraste, `lang` |
| Operación | Inexistente | CI/CD, Docker, observabilidad, backups |
| Legal | Inexistente | Base legal, consentimiento, retención, ARCO |

---

## 5. Hallazgos priorizados

Severidad: **P0** bloquea demo/producción; **P1** bloquea una feature completa; **P2** deuda relevante; **P3** higiene.

### P0 — Bloqueantes

| ID | Hallazgo | Evidencia | Impacto | Acción |
|---|---|---|---|---|
| **D-01** | Tailwind no se carga | `src/rutas/layout.css` contiene `@import 'tailwindcss';` pero ningún archivo lo importa (`grep -rn "layout.css" src` no devuelve resultados) | Toda la UI basada en clases Tailwind se renderiza sin estilos; el kit es inservible | Añadir `import './layout.css';` en `src/rutas/+layout.svelte` y retirar del CSS las reglas demo (`body`, `h1`, `a`, `.text-column`) |
| **D-02** | No hay contrato ni capa de API | No existe `src/rutas/api/` ni `openapi/` | Imposible conectar la PWA a datos reales o documentar para terceros | Implementar `/api/v1` y publicar `openapi/openapi.yaml` (ver [08](08-api-openapi-swagger.md)) |

### P1 — Bloquean una feature completa

| ID | Hallazgo | Evidencia | Impacto | Acción |
|---|---|---|---|---|
| **D-03** | No es una PWA | Sin `src/service-worker/`, `static/manifest.webmanifest`, iconos ni meta tags | No se puede instalar, no funciona offline, no hay caché | Ver [04-pwa-offline.md](04-pwa-offline.md) |
| **D-04** | Pruebas no representativas | Solo `src/lib/vitest-examples/greet.spec.ts`; no hay pruebas de componentes ni e2e | Regresiones invisibles; el pipeline no protege nada | Ver [09-testing.md](09-testing.md) |
| **D-05** | Sin hooks ni sesión | No existen `src/hooks.*`; `app.d.ts` tiene `App` vacío | Sin autenticación, autorización, auditoría ni cabeceras de seguridad | Ver [07-hooks-y-seguridad.md](07-hooks-y-seguridad.md) |
| **D-06** | Código demo en el build | Rutas `/sverdle` (juego) y `/users` con datos hardcodeados | Peso muerto, superficie de ataque y confusión de alcance | Mover a `src/rutas/(lab)/` excluido del deploy o eliminar antes de release |
| **D-07** | Adapter indefinido | `adapter-auto` en `vite.config.ts` | El build puede fallar o desplegarse en un runtime no soportado | Elegir `adapter-node` (ADR-0005) o `adapter-cloudflare` explícito |
| **D-08** | `App` sin tipos | `src/app.d.ts` solo tiene comentarios | `locals`, `PageData` y `Error` sin tipar; se pierde seguridad | Declarar `Locals`, `PageData`, `PageState` y `Error` |

### P2 — Deuda relevante

| ID | Hallazgo | Evidencia | Impacto | Acción |
|---|---|---|---|---|
| **D-09** | APIs legacy de v2 | `Layout.svelte` y `stores.ts` importan `$app/environment`; v3 lo renombró a `$app/env` y lo deprecó | Deuda con fecha de remoción en v4 | Migrar a `$app/env` y `$app/state` |
| **D-10** | Nav activa calculada en cliente | `Layout.svelte` usa `afterNavigate` + `$state` en lugar de `page` de `$app/state` | El estado activo no es correcto en SSR y se duplica estado | Usar `page.url.pathname` de `$app/state` |
| **D-11** | Fila de tabla no accesible | `Table.svelte`: `<tr onclick={...}>` sin `tabindex`, rol ni manejo de teclado | Incumple WCAG 2.2 (2.1.1) si se usa para navegar | Añadir botón/enlace en una celda o `role="button"`, `tabindex="0"`, `onkeydown` |
| **D-12** | Dependencia externa de avatares | `/users` usa `https://i.pravatar.cc/150?u=...` | Fuga de identificadores a terceros, fallo sin red, costo de datos | Usar avatares locales o iniciales; `loading="lazy"` |
| **D-13** | Idioma y formato | `app.html` tiene `lang="en"`; `utils.ts` formatea `en-US` | Mala accesibilidad y fechas/números incorrectos para Perú | `lang="es-PE"`, `Intl` con `es-PE`, zona `America/Lima` |
| **D-14** | Activos duplicados | `src/lib/assets/favicon.svg` y `static/favicon.svg` | Confusión de fuente de verdad | Conservar solo `static/` para activos públicos |
| **D-15** | Sin página de error | No existe `src/rutas/+error.svelte` | Errores 404/500 muestran la página por defecto | Crear `+error.svelte` con recuperación y enlace a inicio |
| **D-16** | Sin validación de entorno | No existe `src/env.ts` | Fallos en runtime por variables ausentes | Usar `defineEnvVars` (ver [03](03-sveltekit-3.md#9-variables-de-entorno-tipadas)) |
| **D-17** | CSS demo global | `layout.css` define `body` con gradiente, `h1` centrado y `a` rojo | Si se importa, rompe el design system | Reducir a tokens y `@import 'tailwindcss';` |

### P3 — Higiene

| ID | Hallazgo | Evidencia | Acción |
|---|---|---|---|
| **D-18** | Repositorio con un solo commit y cambios sin commitear | `git status` muestra 2 archivos modificados | Commit atómico antes de iniciar features |
| **D-19** | Scripts mezclan pnpm y npm | `"test": "npm run test:unit -- --run"` con `pnpm-lock.yaml` | Usar `pnpm run` o `pnpm test` |
| **D-20** | Falta metadata de runtime | Sin `engines.node` ni `packageManager` | Declarar Node ≥ 22.17 y pnpm |
| **D-21** | Nombre genérico | `"name": "proyectoonedrive"` | Renombrar a `cuadra` cuando se decida el nombre |
| **D-22** | Sin `.nvmrc`/`.node-version` | — | Fijar versión de Node para CI y onboarding |

---

## 6. Verificación reproducible

Ejecutar en orden. Los resultados esperados son los del estado actual; si algo falla, anotar el error antes de tocar código.

```bash
# 1. Estado del árbol
git status --short
git log --oneline -5

# 2. Tipos y Svelte
pnpm check

# 3. Lint y formato
pnpm lint

# 4. Pruebas
pnpm test

# 5. Build de producción
pnpm build

# 6. Auditoría rápida de PWA (tras implementarla)
npx lighthouse http://localhost:4173 --only-categories=pwa,accessibility,performance
```

**Lectura esperada hoy:**

- `pnpm check` probablemente pasa (los componentes compilan), pero no valida nada de negocio.
- `pnpm build` puede completar; el problema no es el build, sino que el resultado no es una PWA y no tiene API.
- `pnpm test` ejecuta un único test de saludo.
- Lighthouse no otorgará "installable" porque no hay manifest ni service worker.

---

## 7. Quick wins (≤ 1 día cada uno)

| # | Tarea | Archivos | Resultado |
|---|---|---|---|
| 1 | Importar Tailwind y limpiar CSS demo | `src/rutas/+layout.svelte`, `src/rutas/layout.css` | UI con estilos reales |
| 2 | Tipar `App` | `src/app.d.ts` | `locals.user` y errores tipados |
| 3 | `lang="es-PE"` + `theme-color` + `manifest` | `src/app.html`, `static/manifest.webmanifest` | Base instalable y accesible |
| 4 | Página de error | `src/rutas/+error.svelte` | Recuperación ante 404/500 |
| 5 | Scripts consistentes | `package.json` | `pnpm test` funciona sin npm |
| 6 | Eliminar `i.pravatar.cc` | `src/rutas/users/+page.svelte` | Sin dependencia externa ni fuga de IDs |
| 7 | Mover demos a `(lab)` | `src/rutas/sverdle`, `src/rutas/users` | Build de producción limpio |

---

## 8. Criterios para declarar la base "sana"

- [ ] `pnpm check`, `pnpm lint` y `pnpm test` pasan en local y en CI.
- [ ] `pnpm build` produce un artefacto con adapter explícito.
- [ ] La app carga Tailwind y no tiene CSS global de demo.
- [ ] `App.Locals` y `App.Error` están tipados.
- [ ] Existe `src/rutas/+error.svelte`.
- [ ] Existe manifest + service worker y Lighthouse marca la app como instalable.
- [ ] No hay rutas demo en el build de producción.
- [ ] `src/env.ts` valida todas las variables requeridas al arrancar.
- [ ] Hay al menos un test de dominio, uno de componente y uno e2e en CI.

Cuando estos criterios se cumplan, el repositorio deja de ser un scaffold y pasa a ser una base sobre la que se puede implementar el MVP sin arrastrar deuda estructural.

---

## 9. Riesgos si se empieza a features sin cerrar lo anterior

1. **Estilos:** cada componente nuevo se validará "a ojo" sin Tailwind, generando retrabajo masivo.
2. **Datos:** sin repositorios, la lógica de negocio se dispersará en componentes y será imposible testear offline.
3. **Offline:** añadir service worker después de la lógica de red obliga a reescribir fetch, caché y errores.
4. **Contrato:** si la API nace sin OpenAPI, el frontend y el backend divergen y Swagger se vuelve documentación decorativa.
5. **Legal:** si se recolectan fotos y geolocalización sin base legal ni retención, el costo de corregirlo es alto y el riesgo reputacional también.

La secuencia correcta está en [13-roadmap-backlog.md](13-roadmap-backlog.md): **fundaciones → offline → API → panel → endurecimiento**.
