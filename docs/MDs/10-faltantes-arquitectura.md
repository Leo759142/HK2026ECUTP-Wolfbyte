# Faltantes para alcanzar la arquitectura (según planes MrMDs)

## Objetivo
Cerrar la brecha entre el estado actual (stubs/scaffolding) y la arquitectura descrita en `docs/MrMDs/` (10factos, CF2_Plan, HUCURFRNF), para cumplir RF/CU/HU del proyecto.

## Faltantes por subsistema

### S1 Identidad y Roles (RF01, RF03)
- Registro con celular+alias y PIN (CU01).
- Roles como datos en `rbac.ts` (Vecino, Referente, Emprendedor, Coordinador) y políticas por clasificación.
- Auth/sesión/RBAC real en `hooks.server.ts`.

### S2 Grupos y Zonas (RF02, RF04)
- Unirse a grupo por búsqueda de zona o invitación WhatsApp.
- Aprobación de ingresos por Referente (CU02).
- Moderación: ocultar/aprobar contenido con registro de moderador.

### S3 Proximidad (RF05–RF08)
- Publicar servicio en ≤3 pasos (CU03).
- Búsqueda por categoría/zona (CU04).
- Visto Bueno append-only con etiqueta (CU05).
- Reputación por conteo de eventos + insignias (RF12).

### S4 Cadena de Favores (RF09–RF11)
- Publicar favor ≤3 pasos (CU06), ofrecerse (CU07).
- Cierre mutuo "Se cumplió" con confirmación de ambas partes (CU08) sin QR.

### S5 Emergencia (RF12–RF16)
- Activación por Coordinador (CU09), reporte de necesidad (CU10).
- Directorio de apoyo en emergencia (CU11), tablero humanitario.
- Sugerencia de alertas desde fuentes oficiales (RF16).

### S6 Confianza y Etiquetado
- Etiquetas funcionales (favor, visto bueno, servicio, alerta, acción pendiente).
- Reporte de abusos y rate limit (RF20).

### S7 Publicidad local (RF21–RF22)
- Anuncios "Patrocinado" por zona.
- Suspensión automática en emergencia.

### S8 Offline y Sincronización (RF17–RF18)
- DAO real SQLite WASM sobre OPFS + fallback Dexie.
- Outbox real + service worker + backoff exponencial.
- Idempotencia + cursor en `/api/v1/sync`.

### S9 Seguridad y Privacidad (RF19–RF20)
- Geohash/anonimización a nivel de manzana.
- Cifrado en reposo (WebCrypto) para tokens/PIN.
- Rate limit cliente+servidor.

### S10 Accesibilidad e Idioma (RF23–RF25)
- Tutorial guiado repetible.
- i18n ES/QU en flujos críticos.
- Alto contraste, botones grandes, mensajes de error accionables, aria-live.

## Pendientes técnicos globales
- Implementar DAO real cliente + adaptador Postgres según `schema_postgres.sql`.
- Conectar `+page.server.ts`/stores a repositorios reales.
- Componentes UI accesibles y estados de carga/error.
- Deploy con CI y prueba en celular real.

## Nota de arquitectura CRDT
Aplicar simplificación sugerida: eventos append-only para vistos buenos/publicaciones; LWW para perfil propio; reputación calculada contando eventos al renderizar.
