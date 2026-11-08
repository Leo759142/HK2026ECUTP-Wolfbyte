# Implementación RF/RNF (borrador técnico)

## Ruta/estructura
- `rutas/` es el árbol de rutas SvelteKit (configurado en `svelte.config.js`).
- `src/dominio/` contiene reglas/tipos alineados a `docs/MrMDs/schema_sqlite.sql`.
- `src/datos/dao.ts` es stub cliente para outbox/local DB; `src/sync/api.ts` publica con idempotencia.
- `static/api/openapi.yaml` es el contrato Swagger/OpenAPI 3.1 servido en `/api/openapi.yaml`.
- `rutas/api/docs/+page.svelte` renderiza Swagger UI.

## API v1 (stubs contrato-primero)
- `POST/GET /api/v1/servicios` (RF05-RF08)
- `POST /api/v1/servicios/{id}/recomendaciones` append-only visto bueno/retiro
- `POST/GET /api/v1/favores` (RF09-RF10)
- `POST /api/v1/favores/{id}/confirmaciones` cierre mutuo "Se cumplió" (RF11)
- `POST/GET /api/v1/alertas` ubicación aproximada (RF13/RF19)
- `POST /api/v1/emergencias` activación por coordinador (RF12)
- `GET/POST /api/v1/sync` cursor + outbox idempotente (RF17/RF18)
Todas las escrituras exigen `Idempotency-Key` y responden Problem Details ante errores.

## Páginas Svelte (Figma/RF)
- `/` Inicio y navegación accesible.
- `/servicios` directorio + etiquetas de recomendación.
- `/favores` estados abierto/en_curso/cerrado y confirmación mutua demo.
- `/emergencia` tablero humanitario, sin dirección exacta.
- `/mapa` placeholder GIS con capas y coords aproximadas.
- `/publicar?tipo=servicio|favor|alerta` flujo 3 pasos (RF05/RF09/RF13/RF25).
- `/perfil` sesión, roles, reputación por eventos, privacidad/offline.
- `/api/docs` Swagger UI.

## RNF cubiertos en diseño/código base
- Offline-first: outbox + estados "Pendiente de enviar/Enviada" + Idempotency-Key.
- Privacidad: `lat_aprox/lng_aprox`, enmascaramiento geohash, no dirección exacta.
- Accesibilidad: skip link, labels, roles de estado/alerta, botones grandes/táctiles base.
- Confianza: eventos append-only para vistos buenos/confirmaciones/reputación.
- Seguridad/moderación: hooks para RBAC/reportes/bloqueos; server manda estados críticos.

## Pendientes reales
- Implementar DAO real SQLite cliente + adaptador servidor Postgres según `schema_postgres.sql`.
- Conectar `+page.server.ts`/stores a repositorios reales.
- Auth/sesión/RBAC en `hooks.server.ts`.
- Moderación, anuncios visibles con emergencia activa, puntos de apoyo/recursos críticos, i18n ES/QU.
