export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	app_dir: "_app",
	app_path: "_app",
	assets: new Set(["avatar-default.png","icon-192.png","icon-512.png","logo.jpg","manifest.webmanifest","sw.js"]),
	mime_types: {".png":"image/png",".jpg":"image/jpeg",".webmanifest":"application/manifest+json",".js":"text/javascript"},
	client: {start:"_app/immutable/entry/start.VstIP5aT.js",app:"_app/immutable/entry/app.C_EBCldD.js",imports:["_app/immutable/entry/start.VstIP5aT.js","_app/immutable/entry/payload.DSmR2FwN.js","_app/immutable/chunks/DclECHGd.js","_app/immutable/chunks/DDk8vyt2.js","_app/immutable/chunks/DihSX-3f.js","_app/immutable/chunks/BtepnQ5F.js","_app/immutable/entry/app.C_EBCldD.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
	
	nodes: [
		__memo(() => import('./nodes/0.js')),
		__memo(() => import('./nodes/1.js')),
		__memo(() => import('./nodes/2.js'))
	],
	remotes: {
		
	},
	routes: [
		{
			id: "/",
			pattern: /^\/$/,
			params: [],
			page: { layouts: [0,], errors: [1,], leaf: 2 },
			endpoint: null
		}
	],
	prerendered_routes: new Set([]),
	matchers: async () => {
		return {};
	},
	server_assets: {}
}
})();
