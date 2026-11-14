// empty during dev
export const immutable = [];
export const prerendered = [];

export const assets = [
	{"path":"api/openapi.yaml"},
	{"path":"robots.txt"}
];

export const routes = [
	{"id":"/api/v1/auth/logout","page":false,"endpoint":true},
	{"id":"/api/v1/auth/me","page":false,"endpoint":true},
	{"id":"/api/v1/auth/otp/solicitar","page":false,"endpoint":true},
	{"id":"/api/v1/auth/otp/verificar","page":false,"endpoint":true},
	{"id":"/api/v1/auth/registro","page":false,"endpoint":true},
	{"id":"/api/v1/contactos/pendientes","page":false,"endpoint":true},
	{"id":"/api/v1/contactos/[contactoId]","page":false,"endpoint":true},
	{"id":"/api/v1/demo/antiguedad","page":false,"endpoint":true},
	{"id":"/api/v1/demo/favores/[favorId]/confirmar-otro","page":false,"endpoint":true},
	{"id":"/api/v1/demo/guardian","page":false,"endpoint":true},
	{"id":"/api/v1/demo/reiniciar","page":false,"endpoint":true},
	{"id":"/api/v1/emergencias","page":false,"endpoint":true},
	{"id":"/api/v1/emergencias/activa","page":false,"endpoint":true},
	{"id":"/api/v1/emergencias/[emergenciaId]","page":false,"endpoint":true},
	{"id":"/api/v1/emergencias/[emergenciaId]/acuse","page":false,"endpoint":true},
	{"id":"/api/v1/emergencias/[emergenciaId]/atender","page":false,"endpoint":true},
	{"id":"/api/v1/emergencias/[emergenciaId]/confirmar","page":false,"endpoint":true},
	{"id":"/api/v1/emergencias/[emergenciaId]/descartar","page":false,"endpoint":true},
	{"id":"/api/v1/emergencias/[emergenciaId]/pedidos","page":false,"endpoint":true},
	{"id":"/api/v1/estado","page":false,"endpoint":true},
	{"id":"/api/v1/favores","page":false,"endpoint":true},
	{"id":"/api/v1/favores/[favorId]","page":false,"endpoint":true},
	{"id":"/api/v1/favores/[favorId]/liberar","page":false,"endpoint":true},
	{"id":"/api/v1/favores/[favorId]/listo","page":false,"endpoint":true},
	{"id":"/api/v1/favores/[favorId]/reservar","page":false,"endpoint":true},
	{"id":"/api/v1/grupos-apoyo","page":false,"endpoint":true},
	{"id":"/api/v1/moderacion/pendientes","page":false,"endpoint":true},
	{"id":"/api/v1/moderacion/resolver","page":false,"endpoint":true},
	{"id":"/api/v1/notificaciones/suscripcion","page":false,"endpoint":true},
	{"id":"/api/v1/pedidos/[pedidoId]/ayudar","page":false,"endpoint":true},
	{"id":"/api/v1/pedidos/[pedidoId]/resolver","page":false,"endpoint":true},
	{"id":"/api/v1/reportes","page":false,"endpoint":true},
	{"id":"/api/v1/sectores","page":false,"endpoint":true},
	{"id":"/api/v1/sectores/buscar","page":false,"endpoint":true},
	{"id":"/api/v1/sectores/[sectorId]","page":false,"endpoint":true},
	{"id":"/api/v1/servicios","page":false,"endpoint":true},
	{"id":"/api/v1/servicios/[servicioId]","page":false,"endpoint":true},
	{"id":"/api/v1/servicios/[servicioId]/contacto","page":false,"endpoint":true},
	{"id":"/api/v1/servicios/[servicioId]/recomendaciones","page":false,"endpoint":true},
	{"id":"/api/v1/sync/pull","page":false,"endpoint":true},
	{"id":"/api/v1/sync/push","page":false,"endpoint":true},
	{"id":"/api/v1/usuarios/me","page":false,"endpoint":true},
	{"id":"/api/v1/usuarios/me/invitacion-guardian","page":false,"endpoint":true},
	{"id":"/api/v1/usuarios/[usuarioId]","page":false,"endpoint":true}
];