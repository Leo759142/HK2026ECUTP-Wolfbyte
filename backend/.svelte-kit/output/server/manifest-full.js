export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	app_dir: "_app",
	app_path: "_app",
	assets: new Set(["api/openapi.yaml","robots.txt"]),
	mime_types: {".yaml":"text/yaml",".txt":"text/plain"},
	client: {start:"_app/immutable/entry/start.CPyMnPKg.js",app:"_app/immutable/entry/app.D92ikrhm.js",imports:["_app/immutable/entry/start.CPyMnPKg.js","_app/immutable/entry/payload.DSmR2FwN.js","_app/immutable/chunks/DclECHGd.js","_app/immutable/chunks/B62UdX26.js","_app/immutable/chunks/Ov_AgsIi.js","_app/immutable/chunks/ChmR6GNB.js","_app/immutable/entry/app.D92ikrhm.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
	
	nodes: [
		__memo(() => import('./nodes/0.js')),
		__memo(() => import('./nodes/1.js'))
	],
	remotes: {
		
	},
	routes: [
		{
			id: "/api/v1/auth/logout",
			pattern: /^\/api\/v1\/auth\/logout\/?$/,
			params: [],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/auth/logout/_server.ts.js'))
		},
		{
			id: "/api/v1/auth/me",
			pattern: /^\/api\/v1\/auth\/me\/?$/,
			params: [],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/auth/me/_server.ts.js'))
		},
		{
			id: "/api/v1/auth/otp/solicitar",
			pattern: /^\/api\/v1\/auth\/otp\/solicitar\/?$/,
			params: [],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/auth/otp/solicitar/_server.ts.js'))
		},
		{
			id: "/api/v1/auth/otp/verificar",
			pattern: /^\/api\/v1\/auth\/otp\/verificar\/?$/,
			params: [],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/auth/otp/verificar/_server.ts.js'))
		},
		{
			id: "/api/v1/auth/registro",
			pattern: /^\/api\/v1\/auth\/registro\/?$/,
			params: [],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/auth/registro/_server.ts.js'))
		},
		{
			id: "/api/v1/contactos/pendientes",
			pattern: /^\/api\/v1\/contactos\/pendientes\/?$/,
			params: [],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/contactos/pendientes/_server.ts.js'))
		},
		{
			id: "/api/v1/contactos/[contactoId]",
			pattern: /^\/api\/v1\/contactos\/([^/]+?)\/?$/,
			params: [{"name":"contactoId","optional":false,"rest":false,"chained":false}],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/contactos/_contactoId_/_server.ts.js'))
		},
		{
			id: "/api/v1/demo/antiguedad",
			pattern: /^\/api\/v1\/demo\/antiguedad\/?$/,
			params: [],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/demo/antiguedad/_server.ts.js'))
		},
		{
			id: "/api/v1/demo/favores/[favorId]/confirmar-otro",
			pattern: /^\/api\/v1\/demo\/favores\/([^/]+?)\/confirmar-otro\/?$/,
			params: [{"name":"favorId","optional":false,"rest":false,"chained":false}],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/demo/favores/_favorId_/confirmar-otro/_server.ts.js'))
		},
		{
			id: "/api/v1/demo/guardian",
			pattern: /^\/api\/v1\/demo\/guardian\/?$/,
			params: [],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/demo/guardian/_server.ts.js'))
		},
		{
			id: "/api/v1/demo/reiniciar",
			pattern: /^\/api\/v1\/demo\/reiniciar\/?$/,
			params: [],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/demo/reiniciar/_server.ts.js'))
		},
		{
			id: "/api/v1/emergencias",
			pattern: /^\/api\/v1\/emergencias\/?$/,
			params: [],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/emergencias/_server.ts.js'))
		},
		{
			id: "/api/v1/emergencias/activa",
			pattern: /^\/api\/v1\/emergencias\/activa\/?$/,
			params: [],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/emergencias/activa/_server.ts.js'))
		},
		{
			id: "/api/v1/emergencias/[emergenciaId]",
			pattern: /^\/api\/v1\/emergencias\/([^/]+?)\/?$/,
			params: [{"name":"emergenciaId","optional":false,"rest":false,"chained":false}],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/emergencias/_emergenciaId_/_server.ts.js'))
		},
		{
			id: "/api/v1/emergencias/[emergenciaId]/acuse",
			pattern: /^\/api\/v1\/emergencias\/([^/]+?)\/acuse\/?$/,
			params: [{"name":"emergenciaId","optional":false,"rest":false,"chained":false}],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/emergencias/_emergenciaId_/acuse/_server.ts.js'))
		},
		{
			id: "/api/v1/emergencias/[emergenciaId]/atender",
			pattern: /^\/api\/v1\/emergencias\/([^/]+?)\/atender\/?$/,
			params: [{"name":"emergenciaId","optional":false,"rest":false,"chained":false}],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/emergencias/_emergenciaId_/atender/_server.ts.js'))
		},
		{
			id: "/api/v1/emergencias/[emergenciaId]/confirmar",
			pattern: /^\/api\/v1\/emergencias\/([^/]+?)\/confirmar\/?$/,
			params: [{"name":"emergenciaId","optional":false,"rest":false,"chained":false}],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/emergencias/_emergenciaId_/confirmar/_server.ts.js'))
		},
		{
			id: "/api/v1/emergencias/[emergenciaId]/descartar",
			pattern: /^\/api\/v1\/emergencias\/([^/]+?)\/descartar\/?$/,
			params: [{"name":"emergenciaId","optional":false,"rest":false,"chained":false}],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/emergencias/_emergenciaId_/descartar/_server.ts.js'))
		},
		{
			id: "/api/v1/emergencias/[emergenciaId]/pedidos",
			pattern: /^\/api\/v1\/emergencias\/([^/]+?)\/pedidos\/?$/,
			params: [{"name":"emergenciaId","optional":false,"rest":false,"chained":false}],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/emergencias/_emergenciaId_/pedidos/_server.ts.js'))
		},
		{
			id: "/api/v1/estado",
			pattern: /^\/api\/v1\/estado\/?$/,
			params: [],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/estado/_server.ts.js'))
		},
		{
			id: "/api/v1/favores",
			pattern: /^\/api\/v1\/favores\/?$/,
			params: [],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/favores/_server.ts.js'))
		},
		{
			id: "/api/v1/favores/[favorId]",
			pattern: /^\/api\/v1\/favores\/([^/]+?)\/?$/,
			params: [{"name":"favorId","optional":false,"rest":false,"chained":false}],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/favores/_favorId_/_server.ts.js'))
		},
		{
			id: "/api/v1/favores/[favorId]/liberar",
			pattern: /^\/api\/v1\/favores\/([^/]+?)\/liberar\/?$/,
			params: [{"name":"favorId","optional":false,"rest":false,"chained":false}],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/favores/_favorId_/liberar/_server.ts.js'))
		},
		{
			id: "/api/v1/favores/[favorId]/listo",
			pattern: /^\/api\/v1\/favores\/([^/]+?)\/listo\/?$/,
			params: [{"name":"favorId","optional":false,"rest":false,"chained":false}],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/favores/_favorId_/listo/_server.ts.js'))
		},
		{
			id: "/api/v1/favores/[favorId]/reservar",
			pattern: /^\/api\/v1\/favores\/([^/]+?)\/reservar\/?$/,
			params: [{"name":"favorId","optional":false,"rest":false,"chained":false}],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/favores/_favorId_/reservar/_server.ts.js'))
		},
		{
			id: "/api/v1/grupos-apoyo",
			pattern: /^\/api\/v1\/grupos-apoyo\/?$/,
			params: [],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/grupos-apoyo/_server.ts.js'))
		},
		{
			id: "/api/v1/moderacion/pendientes",
			pattern: /^\/api\/v1\/moderacion\/pendientes\/?$/,
			params: [],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/moderacion/pendientes/_server.ts.js'))
		},
		{
			id: "/api/v1/moderacion/resolver",
			pattern: /^\/api\/v1\/moderacion\/resolver\/?$/,
			params: [],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/moderacion/resolver/_server.ts.js'))
		},
		{
			id: "/api/v1/notificaciones/suscripcion",
			pattern: /^\/api\/v1\/notificaciones\/suscripcion\/?$/,
			params: [],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/notificaciones/suscripcion/_server.ts.js'))
		},
		{
			id: "/api/v1/pedidos/[pedidoId]/ayudar",
			pattern: /^\/api\/v1\/pedidos\/([^/]+?)\/ayudar\/?$/,
			params: [{"name":"pedidoId","optional":false,"rest":false,"chained":false}],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/pedidos/_pedidoId_/ayudar/_server.ts.js'))
		},
		{
			id: "/api/v1/pedidos/[pedidoId]/resolver",
			pattern: /^\/api\/v1\/pedidos\/([^/]+?)\/resolver\/?$/,
			params: [{"name":"pedidoId","optional":false,"rest":false,"chained":false}],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/pedidos/_pedidoId_/resolver/_server.ts.js'))
		},
		{
			id: "/api/v1/reportes",
			pattern: /^\/api\/v1\/reportes\/?$/,
			params: [],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/reportes/_server.ts.js'))
		},
		{
			id: "/api/v1/sectores",
			pattern: /^\/api\/v1\/sectores\/?$/,
			params: [],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/sectores/_server.ts.js'))
		},
		{
			id: "/api/v1/sectores/buscar",
			pattern: /^\/api\/v1\/sectores\/buscar\/?$/,
			params: [],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/sectores/buscar/_server.ts.js'))
		},
		{
			id: "/api/v1/sectores/[sectorId]",
			pattern: /^\/api\/v1\/sectores\/([^/]+?)\/?$/,
			params: [{"name":"sectorId","optional":false,"rest":false,"chained":false}],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/sectores/_sectorId_/_server.ts.js'))
		},
		{
			id: "/api/v1/servicios",
			pattern: /^\/api\/v1\/servicios\/?$/,
			params: [],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/servicios/_server.ts.js'))
		},
		{
			id: "/api/v1/servicios/[servicioId]",
			pattern: /^\/api\/v1\/servicios\/([^/]+?)\/?$/,
			params: [{"name":"servicioId","optional":false,"rest":false,"chained":false}],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/servicios/_servicioId_/_server.ts.js'))
		},
		{
			id: "/api/v1/servicios/[servicioId]/contacto",
			pattern: /^\/api\/v1\/servicios\/([^/]+?)\/contacto\/?$/,
			params: [{"name":"servicioId","optional":false,"rest":false,"chained":false}],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/servicios/_servicioId_/contacto/_server.ts.js'))
		},
		{
			id: "/api/v1/servicios/[servicioId]/recomendaciones",
			pattern: /^\/api\/v1\/servicios\/([^/]+?)\/recomendaciones\/?$/,
			params: [{"name":"servicioId","optional":false,"rest":false,"chained":false}],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/servicios/_servicioId_/recomendaciones/_server.ts.js'))
		},
		{
			id: "/api/v1/sync/pull",
			pattern: /^\/api\/v1\/sync\/pull\/?$/,
			params: [],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/sync/pull/_server.ts.js'))
		},
		{
			id: "/api/v1/sync/push",
			pattern: /^\/api\/v1\/sync\/push\/?$/,
			params: [],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/sync/push/_server.ts.js'))
		},
		{
			id: "/api/v1/usuarios/me",
			pattern: /^\/api\/v1\/usuarios\/me\/?$/,
			params: [],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/usuarios/me/_server.ts.js'))
		},
		{
			id: "/api/v1/usuarios/me/invitacion-guardian",
			pattern: /^\/api\/v1\/usuarios\/me\/invitacion-guardian\/?$/,
			params: [],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/usuarios/me/invitacion-guardian/_server.ts.js'))
		},
		{
			id: "/api/v1/usuarios/[usuarioId]",
			pattern: /^\/api\/v1\/usuarios\/([^/]+?)\/?$/,
			params: [{"name":"usuarioId","optional":false,"rest":false,"chained":false}],
			page: null,
			endpoint: __memo(() => import('./entries/endpoints/api/v1/usuarios/_usuarioId_/_server.ts.js'))
		}
	],
	prerendered_routes: new Set([]),
	matchers: async () => {
		return {};
	},
	server_assets: {}
}
})();
