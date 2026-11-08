# Plan de union Frontend-Backend (Ayni)

## Objetivo
Alinear frontend (rutas SvelteKit) con dominio, contratos API v1 y repositorios/servicios.

## Capas
- Dominio: src/dominio (entidades, reglas, tipos, errores)
- Repositorios: src/repositorios (interfaces + impl local/API)
- Servicios: src/aplicacion (casos de uso)
- API: src/rutas/api/v1 (contrato-first)
- Frontend: src/rutas (pages) + src/lib/components

## Repositorios requeridos
servicios, recomendaciones, favores, favorConfirmaciones, alertas, emergencias, recursosCriticos, usuarios, zonas, grupos, membresias, anuncios, reputacion, puntosApoyo, sync.

## Servicios (casos de uso)
ServicioService, FavorService, AlertaService, EmergenciaService, SyncService, UsuarioService, RecomendacionService.

## Mapeo frontend -> API
- /servicios -> GET/POST /api/v1/servicios, POST /api/v1/servicios/{id}/recomendaciones
- /favores -> GET/POST /api/v1/favores, POST /api/v1/favores/{id}/confirmaciones
- /emergencia -> POST/GET /api/v1/alertas, POST /api/v1/emergencias
- /publicar -> create flows
- /mapa -> alertas ubicacion aproximada
- /perfil -> usuario, reputacion
- /api/docs -> OpenAPI

## Pasos
1. Definir interfaces de repositorios (contratos) en src/dominio/repositorios.
2. Implementar repos API (fetch) en src/repositorios/*.api.ts.
3. Implementar servicios en src/aplicacion.
4. Conectar pages via +page.server.ts y stores.
5. Idempotency-Key en escrituras, Problem Details en errores.
6. Tests de integracion por endpoint.
