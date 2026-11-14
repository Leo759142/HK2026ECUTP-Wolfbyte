import { a as derived, c as spread_props, d as attr, f as clsx, i as bind_props, l as stringify, m as escape_html, n as attr_style, o as ensure_array_like, r as attributes, t as attr_class } from "../../chunks/server.js";
import "../../chunks/index-server.js";
// src/lib/storage.js
var PREFIX = "ayni:v1:";
var listeners = /* @__PURE__ */ new Set();
function storageAvailable() {
	try {
		return typeof localStorage !== "undefined";
	} catch {
		return false;
	}
}
/** Avisa a los componentes suscritos que una clave cambió. */
function emit(key) {
	listeners.forEach((fn) => fn(key));
}
function subscribe(fn) {
	listeners.add(fn);
	return () => listeners.delete(fn);
}
if (typeof window !== "undefined") window.addEventListener("storage", (event) => {
	if (event.key && event.key.startsWith(PREFIX)) emit(event.key.slice(8));
	if (event.key === null) emit("*");
});
function load(key, fallback) {
	if (!storageAvailable()) return fallback;
	try {
		const raw = localStorage.getItem(PREFIX + key);
		return raw === null ? fallback : JSON.parse(raw);
	} catch {
		return fallback;
	}
}
function save(key, value) {
	if (storageAvailable()) try {
		localStorage.setItem(PREFIX + key, JSON.stringify(value));
	} catch (error) {
		console.warn("[AYNI] No se pudo guardar en localStorage:", error);
	}
	emit(key);
}
/** UUID v4. Usa getRandomValues: funciona también fuera de HTTPS (celular por la red local). */
function uid() {
	if (typeof crypto !== "undefined" && crypto.randomUUID) try {
		return crypto.randomUUID();
	} catch {}
	const b = /* @__PURE__ */ new Uint8Array(16);
	crypto.getRandomValues(b);
	b[6] = b[6] & 15 | 64;
	b[8] = b[8] & 63 | 128;
	const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
	return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
/** CRUD genérico sobre colecciones. */
var db = {
	/** READ: todos los elementos de una colección. */
	list(collection) {
		return load(collection, []);
	},
	/** READ: un elemento por id (o null). */
	get(collection, id) {
		return load(collection, []).find((item) => item.id === id) ?? null;
	},
	/** CREATE: agrega un elemento con id y fechas. Devuelve el elemento. */
	create(collection, data) {
		const now = Date.now();
		const item = {
			id: uid(),
			createdAt: now,
			updatedAt: now,
			...data
		};
		save(collection, [item, ...load(collection, [])]);
		return item;
	},
	/** UPDATE: `patch` puede ser un objeto o una función (item) => cambios. */
	update(collection, id, patch) {
		let updated = null;
		save(collection, load(collection, []).map((item) => {
			if (item.id !== id) return item;
			const changes = typeof patch === "function" ? patch(item) : patch;
			updated = {
				...item,
				...changes,
				updatedAt: Date.now()
			};
			return updated;
		}));
		return updated;
	},
	/** DELETE: elimina por id. */
	remove(collection, id) {
		save(collection, load(collection, []).filter((item) => item.id !== id));
	},
	/** DELETE varios que cumplan una condición. */
	removeWhere(collection, predicate) {
		save(collection, load(collection, []).filter((item) => !predicate(item)));
	},
	/** Borra TODOS los datos de AYNI (botón "Reiniciar datos de demostración"). */
	reset() {
		if (storageAvailable()) Object.keys(localStorage).filter((key) => key.startsWith(PREFIX)).forEach((key) => localStorage.removeItem(key));
		emit("*");
	}
};
// src/lib/i18n.js
var DICT = {
	es: {
		"nav.inicio": "Inicio",
		"nav.favores": "Favores",
		"nav.mapa": "Mapa",
		"nav.yo": "Yo",
		"nav.ahora": "Ahora",
		"nav.grupos": "Grupos",
		"nav.publicar": "Publicar",
		hola: "¡Hola",
		lema: "Hoy por ti, mañana por mí",
		buscar: "¿Qué necesitas hoy?",
		oficios: "Oficios del barrio",
		recomendados: "Los más recomendados",
		crearCuenta: "Crear cuenta",
		yaTengo: "Ya tengo cuenta",
		favores: "Cadena de Favores",
		favoresSub: "Sin dinero, entre vecinos",
		reportar: "¿Pasa algo grave? Reportar emergencia",
		misPublicaciones: "Mis publicaciones",
		idioma: "Idioma y lectura",
		enLinea: "En línea",
		sinConexion: "Sin conexión · Ahorrando datos. Ves lo último guardado."
	},
	en: {
		"nav.inicio": "Home",
		"nav.favores": "Favors",
		"nav.mapa": "Map",
		"nav.yo": "Me",
		"nav.ahora": "Now",
		"nav.grupos": "Groups",
		"nav.publicar": "Post",
		hola: "Hi",
		lema: "Today for you, tomorrow for me",
		buscar: "What do you need today?",
		oficios: "Neighborhood trades",
		recomendados: "Most recommended",
		crearCuenta: "Create account",
		yaTengo: "I already have an account",
		favores: "Chain of Favors",
		favoresSub: "No money, between neighbors",
		reportar: "Something serious? Report an emergency",
		misPublicaciones: "My posts",
		idioma: "Language & reading",
		enLinea: "Online",
		sinConexion: "Offline · Saving data. You are seeing the last saved info."
	},
	qu: { hola: "¡Allinllachu" }
};
var IDIOMAS = [
	{
		id: "es",
		label: "Español"
	},
	{
		id: "en",
		label: "English"
	},
	{
		id: "qu",
		label: "Runasimi (quechua)"
	}
];
function translate(lang, key) {
	return DICT[lang]?.[key] ?? DICT.es[key] ?? key;
}
// src/lib/data.js
var RESERVA_MS = 36e5;
var CATEGORIAS = [
	{
		id: "gasfiteria",
		label: "Gasfitería",
		emoji: "🔧"
	},
	{
		id: "electricidad",
		label: "Electricidad",
		emoji: "⚡"
	},
	{
		id: "carpinteria",
		label: "Carpintería",
		emoji: "🪚"
	},
	{
		id: "cerrajeria",
		label: "Cerrajería",
		emoji: "🔑"
	},
	{
		id: "mascotas",
		label: "Mascotas",
		emoji: "🐕"
	},
	{
		id: "clases",
		label: "Clases",
		emoji: "📚"
	},
	{
		id: "costura",
		label: "Costura",
		emoji: "✂️"
	},
	{
		id: "comida",
		label: "Comida casera",
		emoji: "🍲"
	},
	{
		id: "otros",
		label: "Otros",
		emoji: "🧰"
	}
];
var catById = (id) => CATEGORIAS.find((c) => c.id === id) ?? CATEGORIAS[CATEGORIAS.length - 1];
var ETIQUETAS = [
	{
		id: "puntual",
		label: "Puntual",
		emoji: "⏰"
	},
	{
		id: "precio",
		label: "Precio justo",
		emoji: "💰"
	},
	{
		id: "limpio",
		label: "Trabajo limpio",
		emoji: "✨"
	},
	{
		id: "amable",
		label: "Amable",
		emoji: "😊"
	},
	{
		id: "rapido",
		label: "Rápido",
		emoji: "⚡"
	},
	{
		id: "volveria",
		label: "Volvería a llamarlo",
		emoji: "🔁"
	}
];
var etiquetaById = (id) => ETIQUETAS.find((e) => e.id === id);
/** Tipos de publicación en la Cadena de Favores. Clases completas para Tailwind. */
var TIPOS_FAVOR = {
	pido: {
		label: "PIDO",
		emoji: "🙋",
		chip: "bg-ambar-claro text-tinta"
	},
	presto: {
		label: "PRESTO",
		emoji: "🔨",
		chip: "bg-petroleo-claro text-petroleo-osc"
	},
	regalo: {
		label: "REGALO",
		emoji: "🎁",
		chip: "bg-morado-claro text-morado-osc"
	},
	intercambio: {
		label: "INTERCAMBIO",
		emoji: "🔄",
		chip: "bg-white text-tinta border border-linea"
	}
};
var TIPOS_EMERGENCIA = [
	{
		id: "inundacion",
		label: "Inundación",
		emoji: "🌊"
	},
	{
		id: "incendio",
		label: "Incendio",
		emoji: "🔥"
	},
	{
		id: "sismo",
		label: "Sismo o derrumbe",
		emoji: "🏚️"
	},
	{
		id: "servicios",
		label: "Sin agua o luz",
		emoji: "🚱"
	},
	{
		id: "accidente",
		label: "Accidente",
		emoji: "🚑"
	},
	{
		id: "otro",
		label: "Otro",
		emoji: "❓"
	}
];
var emergenciaById = (id) => TIPOS_EMERGENCIA.find((e) => e.id === id) ?? TIPOS_EMERGENCIA[5];
var NECESIDADES = [
	{
		id: "agua",
		label: "Agua",
		emoji: "💧"
	},
	{
		id: "comida",
		label: "Comida",
		emoji: "🍲"
	},
	{
		id: "salud",
		label: "Salud",
		emoji: "🩺"
	},
	{
		id: "rescate",
		label: "Rescate",
		emoji: "🛟"
	},
	{
		id: "refugio",
		label: "Refugio",
		emoji: "🏠"
	},
	{
		id: "otro",
		label: "Otro",
		emoji: "❓"
	}
];
var necesidadById = (id) => NECESIDADES.find((n) => n.id === id) ?? NECESIDADES[5];
var VULNERABLES = [
	{
		id: "adulto",
		label: "Adulto mayor",
		emoji: "👵"
	},
	{
		id: "ninos",
		label: "Niños",
		emoji: "👶"
	},
	{
		id: "discapacidad",
		label: "Discapacidad",
		emoji: "♿"
	},
	{
		id: "gestante",
		label: "Gestante",
		emoji: "🤰"
	},
	{
		id: "mascotas",
		label: "Mascotas",
		emoji: "🐕"
	}
];
var RECURSOS = [
	{
		id: "agua",
		label: "Agua",
		emoji: "💧"
	},
	{
		id: "refugio",
		label: "Albergue",
		emoji: "🏫"
	},
	{
		id: "salud",
		label: "Salud",
		emoji: "🩺"
	},
	{
		id: "comida",
		label: "Comida",
		emoji: "🍲"
	},
	{
		id: "energia",
		label: "Energía",
		emoji: "🔌"
	},
	{
		id: "traslado",
		label: "Traslado",
		emoji: "🚐"
	}
];
var NUMEROS_EMERGENCIA = [
	{
		label: "Bomberos",
		numero: "116",
		emoji: "🚒"
	},
	{
		label: "Policía",
		numero: "105",
		emoji: "👮"
	},
	{
		label: "SAMU",
		numero: "106",
		emoji: "🚑"
	}
];
var MOTIVOS_REPORTE = [
	"Parece estafa",
	"Información falsa",
	"Contenido ofensivo",
	"Mala experiencia con el servicio",
	"Otro motivo"
];
// src/lib/estado.svelte.js
var COLECCIONES = [
	"users",
	"sectors",
	"services",
	"recommendations",
	"contacts",
	"favors",
	"reports",
	"moderation",
	"emergencies",
	"needs",
	"groups",
	"outbox"
];
var datos = Object.fromEntries(COLECCIONES.map((c) => [c, db.list(c)]));
var AJUSTES_INICIALES = {
	lang: "es",
	largeText: false,
	forceOffline: false
};
var App$1 = class {
	session = load("session", null);
	settings = {
		...AJUSTES_INICIALES,
		...load("settings", {})
	};
	stack = [{
		name: load("session", null)?.userId ? "inicio" : "portada",
		params: {}
	}];
	toast = null;
	netOnline = typeof navigator === "undefined" ? true : navigator.onLine;
	/** GET /api/v1/estado: { demo, ... } */
	servidor = { demo: false };
	get route() {
		return this.stack[this.stack.length - 1];
	}
	get user() {
		return datos.users.find((u) => u.id === this.session?.userId) ?? null;
	}
	get users() {
		return datos.users;
	}
	get sectors() {
		return datos.sectors;
	}
	get sector() {
		const u = this.user;
		return u ? datos.sectors.find((s) => s.id === u.sectorId) ?? null : null;
	}
	get isGuardian() {
		const u = this.user;
		return Boolean(u && (this.sector?.guardianIds?.includes(u.id) || u.isGuardian));
	}
	get online() {
		return this.netOnline && !this.settings.forceOffline;
	}
	get activeEmergency() {
		const u = this.user;
		return u ? datos.emergencies.find((e) => e.sectorId === u.sectorId && e.status === "activa") ?? null : null;
	}
	go = (name, params = {}) => {
		this.stack = [...this.stack, {
			name,
			params
		}];
		scrollTop();
	};
	replace = (name, params = {}) => {
		this.stack = [...this.stack.slice(0, -1), {
			name,
			params
		}];
		scrollTop();
	};
	back = () => {
		if (this.stack.length > 1) this.stack = this.stack.slice(0, -1);
	};
	reset = (name, params = {}) => {
		this.stack = [{
			name,
			params
		}];
		scrollTop();
	};
	#timer;
	notify = (message) => {
		this.toast = message;
		clearTimeout(this.#timer);
		this.#timer = setTimeout(() => this.toast = null, 3200);
	};
	t = (key) => translate(this.settings.lang, key);
	setSettings = (next) => {
		save("settings", typeof next === "function" ? next(this.settings) : next);
	};
	startSession = (userId, screen = "inicio") => {
		save("session", { userId });
		this.reset(screen);
	};
	/** Solo la parte local; acciones.cerrarSesion avisa al servidor. */
	endSession = () => {
		save("session", null);
		this.reset("portada");
	};
};
var scrollTop = () => typeof window !== "undefined" && window.scrollTo?.(0, 0);
var app = new App$1();
subscribe((key) => {
	const todas = key === "*";
	for (const c of COLECCIONES) if (todas || key === c) datos[c] = db.list(c);
	if (todas || key === "session") app.session = load("session", null);
	if (todas || key === "settings") app.settings = {
		...AJUSTES_INICIALES,
		...load("settings", {})
	};
});
if (typeof window !== "undefined") {
	window.addEventListener("online", () => app.netOnline = true);
	window.addEventListener("offline", () => app.netOnline = false);
	const liberar = () => {
		const ahora = Date.now();
		for (const f of db.list("favors")) if (f.status === "reservado" && ahora - (f.reservedAt ?? 0) > 36e5) db.update("favors", f.id, {
			status: "disponible",
			takerId: null,
			reservedAt: null,
			ownerConfirmed: false,
			takerConfirmed: false
		});
	};
	liberar();
	setInterval(liberar, 3e4);
}
// src/lib/util.js
var DIA = 864e5;
/** "Rosa M." para vecinos; "Rosa Mendoza" si la persona eligió mostrarlo. */
function nombreVisible(user, completo = false) {
	if (!user) return "Vecino";
	const apellido = (user.lastName ?? "").trim();
	if (completo || user.showFullName) return `${user.firstName} ${apellido}`.trim();
	return apellido ? `${user.firstName} ${apellido[0]}.` : user.firstName;
}
var inicial = (user) => (user?.firstName?.[0] ?? "?").toUpperCase();
/** Distancia aproximada en cuadras según la manzana (A, B, C…). */
function cuadras(manzanaA, manzanaB) {
	if (!manzanaA || !manzanaB) return 1;
	return Math.abs(manzanaA.charCodeAt(0) - manzanaB.charCodeAt(0));
}
function cuadrasTxt(n) {
	if (n <= 0) return "en tu cuadra";
	return n === 1 ? "a 1 cuadra" : `a ${n} cuadras`;
}
function hace(ts) {
	if (!ts) return "";
	const min = Math.max(0, Math.round((Date.now() - ts) / 6e4));
	if (min < 1) return "ahora";
	if (min < 60) return `hace ${min} min`;
	const h = Math.round(min / 60);
	if (h < 24) return `hace ${h} h`;
	const d = Math.round(h / 24);
	return d === 1 ? "ayer" : `hace ${d} días`;
}
function hora(ts) {
	return new Date(ts).toLocaleTimeString("es-PE", {
		hour: "2-digit",
		minute: "2-digit"
	});
}
var normalizar = (text = "") => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
var diasEnAyni = (user) => user?.createdAt ? Math.floor((Date.now() - user.createdAt) / DIA) : 0;
var progresoGuardian = (user) => Math.min(1, diasEnAyni(user) / 60);
/** Balance de Ayni: favores dados y recibidos (solo favores cerrados y confirmados). */
function balanceAyni(userId, favores) {
	let dados = 0;
	let recibidos = 0;
	for (const f of favores) {
		if (f.status !== "cerrado") continue;
		const daId = f.tipo === "pido" ? f.takerId : f.ownerId;
		const recibeId = f.tipo === "pido" ? f.ownerId : f.takerId;
		if (daId === userId) dados += 1;
		if (recibeId === userId) recibidos += 1;
	}
	return {
		dados,
		recibidos
	};
}
/** Total de Vistos Buenos y conteo por etiqueta de un servicio. */
function statsServicio(servicio, recomendaciones) {
	const propias = recomendaciones.filter((r) => r.serviceId === servicio.id);
	const tags = { ...servicio.baseTags ?? {} };
	for (const r of propias) for (const t of r.tags ?? []) tags[t] = (tags[t] ?? 0) + 1;
	const topTags = Object.entries(tags).sort((a, b) => b[1] - a[1]).map(([id, count]) => ({
		id,
		count
	}));
	return {
		count: (servicio.baseVistos ?? 0) + propias.length,
		topTags,
		comentarios: propias.filter((r) => r.comment)
	};
}
function abrirEnlace(url) {
	if (typeof window !== "undefined") window.open(url, "_blank", "noopener");
}
/** Hash simple para dar posiciones estables a los pines del mapa. */
function hash(text = "") {
	let h = 0;
	for (let i = 0; i < text.length; i += 1) h = h * 31 + text.charCodeAt(i) >>> 0;
	return h;
}
/** Posición (en %) de un pin dentro de la manzana indicada, con un leve desorden. */
function posicionPin(manzanas, manzana, id, cols) {
	const index = Math.max(0, manzanas.indexOf(manzana));
	const rows = Math.ceil(manzanas.length / cols);
	const col = index % cols;
	const row = Math.floor(index / cols);
	const h = hash(id);
	const fx = h % 97 / 97;
	const fy = (h >>> 7) % 89 / 89;
	const w = 100 / cols;
	const hh = 100 / rows;
	return {
		left: col * w + w * (.22 + .56 * fx),
		top: row * hh + hh * (.22 + .56 * fy)
	};
}
// src/lib/api/cliente.js
var BASE = `${"".replace(/\/$/, "")}/api/v1`;
var ErrorApi = class extends Error {
	constructor(status, codigo, mensaje) {
		super(mensaje);
		this.status = status;
		this.codigo = codigo;
	}
	/** Sin respuesta del servidor (sin señal, servidor caído): conviene reintentar. */
	get esDeRed() {
		return this.status === 0;
	}
	get esReintentable() {
		return this.status === 0 || this.status >= 500 || this.status === 429;
	}
};
async function api(metodo, ruta, body, { timeoutMs = 15e3 } = {}) {
	const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
	const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
	let res;
	try {
		res = await fetch(`${BASE}${ruta}`, {
			method: metodo,
			credentials: "include",
			headers: body === void 0 ? {} : { "content-type": "application/json" },
			body: body === void 0 ? void 0 : JSON.stringify(body),
			signal: ctrl?.signal
		});
	} catch {
		throw new ErrorApi(0, "SIN_CONEXION", "No hay conexión con el servidor. Lo intentaremos de nuevo.");
	} finally {
		if (timer) clearTimeout(timer);
	}
	if (res.status === 204) return null;
	const texto = await res.text();
	let data = null;
	try {
		data = texto ? JSON.parse(texto) : null;
	} catch {
		data = null;
	}
	if (!res.ok) throw new ErrorApi(res.status, data?.codigo ?? `HTTP_${res.status}`, data?.mensaje ?? "Algo salió mal. Inténtalo otra vez.");
	return data;
}
var get = (ruta) => api("GET", ruta);
var post = (ruta, body) => api("POST", ruta, body ?? {});
// src/lib/api/adaptadores.js
var ms = (iso) => iso ? Date.parse(iso) : null;
var CODIGOS_MOTIVO = [
	"estafa",
	"falso",
	"ofensivo",
	"mala_experiencia",
	"otro"
];
var motivoACodigo = (texto) => CODIGOS_MOTIVO[Math.max(0, MOTIVOS_REPORTE.indexOf(texto))] ?? "otro";
var codigoAMotivo = (codigo) => MOTIVOS_REPORTE[CODIGOS_MOTIVO.indexOf(codigo)] ?? MOTIVOS_REPORTE[MOTIVOS_REPORTE.length - 1];
var COLECCION_DE_OBJETO = {
	servicio: "services",
	favor: "favors"
};
var OBJETO_DE_COLECCION = {
	services: "servicio",
	favors: "favor"
};
/** VecinoPublico → user local. La API no entrega teléfonos ni apellidos completos de otros vecinos. */
function vecinoALocal(v, sectorId) {
	if (!v) return null;
	const apellido = v.nombre_visible.slice(v.nombre.length).trim();
	return {
		id: v.id,
		firstName: v.nombre,
		lastName: apellido,
		manzana: v.manzana,
		sectorId,
		foto: v.foto ?? null,
		isGuardian: Boolean(v.es_guardian),
		showFullName: Boolean(v.mostrar_nombre_completo),
		verified: true,
		createdAt: ms(v.creado_en)
	};
}
/** Usuario (mi cuenta) → user local completo. */
function usuarioALocal(u) {
	return {
		id: u.id,
		firstName: u.nombre,
		lastName: u.apellido ?? "",
		phone: u.telefono,
		sectorId: u.sector_id,
		manzana: u.manzana,
		location: u.lat_aprox == null ? null : {
			lat: u.lat_aprox,
			lng: u.lng_aprox
		},
		address: u.direccion ?? "",
		district: u.distrito ?? "",
		reference: u.referencia ?? "",
		foto: u.foto ?? null,
		verified: u.verificado,
		showFullName: u.mostrar_nombre_completo,
		inviteAnswered: u.invitacion_guardian ?? null,
		lang: u.idioma,
		largeText: u.letra_grande,
		isGuardian: u.es_guardian,
		caminoGuardian: u.camino_guardian ?? null,
		createdAt: ms(u.creado_en),
		updatedAt: ms(u.actualizado_en)
	};
}
/** Cambios de mi perfil (user local) → cuerpo de PATCH /usuarios/me. */
function perfilADto(patch) {
	const out = {};
	if ("showFullName" in patch) out.mostrar_nombre_completo = patch.showFullName;
	if ("manzana" in patch) out.manzana = patch.manzana;
	if ("lang" in patch) out.idioma = patch.lang;
	if ("largeText" in patch) out.letra_grande = patch.largeText;
	if ("foto" in patch) out.foto = patch.foto;
	if ("district" in patch) out.distrito = patch.district;
	if ("address" in patch) out.direccion = patch.address;
	if ("reference" in patch) out.referencia = patch.reference;
	return out;
}
function sectorALocal(s) {
	return {
		id: s.id,
		name: s.nombre,
		manzanas: s.manzanas,
		guardianIds: (s.guardianes ?? []).map((g) => g.id),
		founderId: s.fundador_id ?? null,
		totalVecinos: s.total_vecinos ?? 0,
		createdAt: ms(s.creado_en)
	};
}
function servicioALocal(s) {
	return {
		id: s.id,
		ownerId: s.dueno_id,
		clase: s.clase,
		categoria: s.categoria,
		titulo: s.titulo,
		descripcion: s.descripcion,
		horario: s.horario,
		precio: s.precio ?? "",
		foto: s.foto ?? null,
		showFullName: s.mostrar_nombre_completo,
		status: s.moderacion === "oculto" ? "oculto" : s.estado,
		hidden: s.moderacion !== "visible",
		moderacion: s.moderacion,
		baseVistos: s.vistos_base ?? 0,
		baseTags: s.etiquetas_base ?? {},
		ownerName: s.dueno?.nombre_visible ?? null,
		createdAt: ms(s.creado_en),
		updatedAt: ms(s.actualizado_en)
	};
}
function servicioADto(local) {
	return {
		clase: local.clase,
		categoria: local.categoria,
		titulo: local.titulo,
		descripcion: local.descripcion,
		horario: local.horario,
		precio: local.precio || null,
		foto: local.foto ?? null,
		mostrar_nombre_completo: Boolean(local.showFullName)
	};
}
var recomendacionALocal = (r) => ({
	id: r.id,
	serviceId: r.servicio_id,
	userId: r.usuario_id,
	tags: r.etiquetas,
	comment: r.comentario,
	createdAt: ms(r.creado_en)
});
var contactoALocal = (c) => ({
	id: c.id,
	serviceId: c.servicio_id,
	userId: c.usuario_id,
	answered: c.respondido,
	attended: c.atendido,
	createdAt: ms(c.creado_en)
});
function favorALocal(f) {
	return {
		id: f.id,
		ownerId: f.dueno_id,
		tipo: f.tipo,
		titulo: f.titulo,
		detalles: f.detalles ?? {},
		foto: f.foto ?? null,
		status: f.moderacion === "oculto" ? "oculto" : f.estado,
		hidden: f.moderacion !== "visible",
		moderacion: f.moderacion,
		takerId: f.tomador_id ?? null,
		reservedAt: ms(f.reservado_en),
		ownerConfirmed: f.dueno_confirmo,
		takerConfirmed: f.tomador_confirmo,
		closedAt: ms(f.cerrado_en),
		whatsappUrl: f.whatsapp_url ?? null,
		createdAt: ms(f.creado_en),
		updatedAt: ms(f.actualizado_en)
	};
}
var favorADto = (local) => ({
	tipo: local.tipo,
	titulo: local.titulo,
	detalles: local.detalles ?? {},
	foto: local.foto ?? null
});
var reporteALocal = (r) => ({
	id: r.id,
	col: COLECCION_DE_OBJETO[r.objeto_tipo],
	targetId: r.objeto_id,
	userId: r.usuario_id,
	reason: codigoAMotivo(r.motivo),
	createdAt: ms(r.creado_en)
});
var moderacionALocal = (p) => ({
	id: `${p.objeto_tipo}:${p.objeto_id}`,
	col: COLECCION_DE_OBJETO[p.objeto_tipo],
	targetId: p.objeto_id,
	total: p.total_reportes,
	titulo: p.titulo,
	descripcion: p.descripcion,
	hidden: p.moderacion !== "visible",
	motivoPrincipal: codigoAMotivo(p.motivo_principal),
	ownerId: p.dueno?.id ?? null,
	createdAt: ms(p.primer_reporte)
});
function emergenciaALocal(e, yoId) {
	return {
		id: e.id,
		sectorId: e.sector_id,
		reporterId: e.reportero_id,
		tipo: e.tipo,
		texto: e.texto ?? "",
		foto: e.foto ?? null,
		manzana: e.manzana,
		status: e.estado,
		confirmedBy: e.confirmada_por ?? null,
		confirmedAt: ms(e.confirmada_en),
		motivo: e.motivo_descarte ?? "",
		reviewedBy: e.revisada_por ?? null,
		reviewedAt: ms(e.revisada_en),
		endedAt: ms(e.atendida_en),
		closedBy: e.cerrada_por ?? null,
		reporterSeen: e.reportero_visto,
		acks: e.mi_respuesta ? { [yoId]: e.mi_respuesta } : {},
		endSeen: e.fin_visto ? { [yoId]: true } : {},
		confirmaciones: e.confirmaciones ?? null,
		resumen: e.resumen ?? null,
		createdAt: ms(e.creado_en),
		updatedAt: ms(e.actualizado_en)
	};
}
function pedidoALocal(p) {
	return {
		id: p.id,
		emergencyId: p.emergencia_id,
		ownerId: p.dueno_id,
		necesidad: p.necesidad,
		quienes: p.vulnerables ?? [],
		cuantas: p.cuantas,
		texto: p.texto ?? "",
		foto: p.foto ?? null,
		manzana: p.manzana,
		status: p.estado,
		helperId: p.ayudante_id ?? null,
		helperAt: ms(p.ayudante_en),
		resolvedAt: ms(p.resuelto_en),
		contactPhone: p.contacto_telefono ?? null,
		direccionExacta: p.direccion_exacta ?? null,
		createdAt: ms(p.creado_en),
		updatedAt: ms(p.actualizado_en)
	};
}
var grupoALocal = (g) => ({
	id: g.id,
	sectorId: g.sector_id,
	emoji: g.emoji,
	name: g.nombre,
	meta: g.meta,
	recurso: g.recurso ?? null,
	manzana: g.manzana ?? null,
	contacto: {
		tipo: g.contacto_tipo,
		valor: g.contacto_valor
	},
	createdAt: ms(g.creado_en)
});
// src/lib/sync/cola.js
var CLAVE = "outbox";
var leerCola = () => load(CLAVE, []);
var guardar = (ops) => save(CLAVE, ops);
/**
* Agrega una operación.
* @param {{entidad: string, operacion: 'crear'|'actualizar'|'eliminar', payload: object, usuarioId: string, ref?: {col: string, id: string}, descripcion?: string}} op
*/
function encolar(op) {
	const item = {
		op_id: uid(),
		entidad: op.entidad,
		operacion: op.operacion,
		payload: op.payload,
		usuarioId: op.usuarioId,
		ref: op.ref ?? null,
		descripcion: op.descripcion ?? "",
		creado_en: (/* @__PURE__ */ new Date()).toISOString(),
		estado: "pendiente",
		intentos: 0,
		siguienteIntento: 0,
		error: null
	};
	guardar([...leerCola(), item]);
	return item;
}
/** Operaciones listas para enviar (del usuario actual, en orden, respetando la espera entre reintentos). */
function listasParaEnviar(usuarioId, ahora = Date.now(), max = 100) {
	return leerCola().filter((o) => o.usuarioId === usuarioId && o.estado === "pendiente" && (o.siguienteIntento ?? 0) <= ahora).slice(0, max);
}
function quitar(opIds) {
	const set = new Set(opIds);
	if (!set.size) return;
	guardar(leerCola().filter((o) => !set.has(o.op_id)));
}
function marcarRechazada(opId, error) {
	guardar(leerCola().map((o) => o.op_id === opId ? {
		...o,
		estado: "rechazada",
		error
	} : o));
}
/** Espera antes de reintentar: 2 s, 4 s, 8 s… hasta 2 minutos. */
var espera = (intentos) => Math.min(12e4, 2e3 * 2 ** Math.min(intentos, 6));
function programarReintento(opIds, motivo, ahora = Date.now()) {
	const set = new Set(opIds);
	guardar(leerCola().map((o) => {
		if (!set.has(o.op_id)) return o;
		const intentos = (o.intentos ?? 0) + 1;
		return {
			...o,
			intentos,
			siguienteIntento: ahora + espera(intentos),
			error: motivo ? {
				codigo: "REINTENTAR",
				mensaje: motivo
			} : o.error
		};
	}));
}
/** ids de registros locales que tienen cambios sin confirmar (el servidor aún no los conoce o no los aplicó). */
function idsConCambiosLocales(usuarioId) {
	const ids = /* @__PURE__ */ new Set();
	for (const o of leerCola()) if (o.usuarioId === usuarioId && o.ref?.id) ids.add(`${o.ref.col}:${o.ref.id}`);
	return ids;
}
// src/lib/sync/motor.js
var oyentes = /* @__PURE__ */ new Set();
var estado = {
	sincronizando: false,
	ultimo: null,
	error: null
};
function cambiar(parcial) {
	estado = {
		...estado,
		...parcial
	};
	oyentes.forEach((fn) => fn(estado));
}
var eventos = /* @__PURE__ */ new Set();
var avisar = (e) => eventos.forEach((fn) => fn(e));
function hayConexion() {
	const ajustes = load("settings", {});
	return (typeof navigator === "undefined" ? true : navigator.onLine !== false) && !ajustes.forceOffline;
}
function mezclar(col, items, convertir, { completo, locales, eliminados = [] }) {
	const actuales = db.list(col);
	const nuevos = items.map(convertir);
	const tieneCambios = (id) => locales.has(`${col}:${id}`);
	if (completo) {
		const delServidor = new Set(nuevos.map((n) => n.id));
		const actualesPorId = new Map(actuales.map((x) => [x.id, x]));
		const soloLocales = actuales.filter((x) => !delServidor.has(x.id) && tieneCambios(x.id));
		const final = nuevos.map((n) => tieneCambios(n.id) && actualesPorId.has(n.id) ? actualesPorId.get(n.id) : n);
		save(col, [...soloLocales, ...final]);
		return;
	}
	if (!nuevos.length && !eliminados.length) return;
	const porId = new Map(actuales.map((x) => [x.id, x]));
	for (const n of nuevos) if (!tieneCambios(n.id)) porId.set(n.id, n);
	for (const id of eliminados) if (!tieneCambios(id)) porId.delete(id);
	save(col, [...porId.values()]);
}
function aplicarCambios(datos, yoId) {
	const c = datos.cambios ?? {};
	const completo = Boolean(datos.completo);
	const locales = idsConCambiosLocales(yoId);
	const yo = c.yo ? usuarioALocal(c.yo) : null;
	const sectorId = yo?.sectorId ?? db.get("users", yoId)?.sectorId;
	const vecinos = (c.usuarios ?? []).map((v) => vecinoALocal(v, sectorId));
	if (yo) {
		const i = vecinos.findIndex((v) => v.id === yo.id);
		if (i >= 0) vecinos.splice(i, 1);
		vecinos.push(yo);
	}
	mezclar("users", vecinos, (x) => x, {
		completo,
		locales: /* @__PURE__ */ new Set()
	});
	mezclar("sectors", c.sectores ?? [], sectorALocal, {
		completo: false,
		locales: /* @__PURE__ */ new Set()
	});
	mezclar("services", c.servicios ?? [], servicioALocal, {
		completo,
		locales,
		eliminados: datos.eliminados?.servicios
	});
	mezclar("recommendations", c.recomendaciones ?? [], recomendacionALocal, {
		completo,
		locales
	});
	mezclar("contacts", c.contactos ?? [], contactoALocal, {
		completo,
		locales
	});
	mezclar("favors", c.favores ?? [], favorALocal, {
		completo,
		locales,
		eliminados: datos.eliminados?.favores
	});
	mezclar("emergencies", c.emergencias ?? [], (e) => emergenciaALocal(e, yoId), {
		completo,
		locales
	});
	mezclar("needs", c.pedidos_ayuda ?? [], pedidoALocal, {
		completo,
		locales
	});
	mezclar("groups", c.grupos_apoyo ?? [], grupoALocal, {
		completo,
		locales
	});
	mezclar("reports", c.reportes ?? [], reporteALocal, {
		completo: true,
		locales
	});
	mezclar("moderation", c.moderacion ?? [], moderacionALocal, {
		completo: true,
		locales: /* @__PURE__ */ new Set()
	});
}
async function enviarCola(usuarioId, resultado) {
	for (let vuelta = 0; vuelta < 10; vuelta += 1) {
		const ops = listasParaEnviar(usuarioId);
		if (!ops.length) return;
		let r;
		try {
			r = await api("POST", "/sync/push", { operaciones: ops.map(({ op_id, entidad, operacion, payload, creado_en }) => ({
				op_id,
				entidad,
				operacion,
				payload,
				creado_en
			})) });
		} catch (e) {
			if (e.status === 401) throw e;
			programarReintento(ops.map((o) => o.op_id), e.message);
			resultado.error = e;
			return;
		}
		const confirmadas = [];
		for (const res of r.resultados ?? []) if (res.resultado === "aplicada" || res.resultado === "duplicada") confirmadas.push(res.op_id);
		else if (res.codigo === "REINTENTAR") programarReintento([res.op_id], res.motivo);
		else if (res.codigo === "DESACTUALIZADO") {
			confirmadas.push(res.op_id);
			resultado.desactualizadas += 1;
			resultado.completo = true;
		} else {
			const op = ops.find((o) => o.op_id === res.op_id);
			marcarRechazada(res.op_id, {
				codigo: res.codigo,
				mensaje: res.motivo
			});
			resultado.rechazadas.push({
				op_id: res.op_id,
				descripcion: op?.descripcion,
				codigo: res.codigo,
				mensaje: res.motivo
			});
			resultado.completo = true;
		}
		quitar(confirmadas);
		resultado.enviadas += confirmadas.length;
	}
}
async function ciclo({ completo = false } = {}) {
	const sesion = load("session", null);
	if (!sesion?.userId || !hayConexion()) return { omitido: true };
	cambiar({ sincronizando: true });
	const resultado = {
		enviadas: 0,
		rechazadas: [],
		desactualizadas: 0,
		completo,
		error: null
	};
	try {
		await enviarCola(sesion.userId, resultado);
		const cursor = load("syncCursor", null);
		const desde = !resultado.completo && cursor?.usuarioId === sesion.userId ? cursor.hasta : null;
		const datos = await api("GET", `/sync/pull${desde ? `?desde=${encodeURIComponent(desde)}` : ""}`);
		aplicarCambios(datos, sesion.userId);
		save("syncCursor", {
			hasta: datos.hasta,
			usuarioId: sesion.userId
		});
		cambiar({
			sincronizando: false,
			ultimo: Date.now(),
			error: resultado.error
		});
	} catch (e) {
		cambiar({
			sincronizando: false,
			error: e
		});
		if (e.status === 401) avisar({ tipo: "sesion-vencida" });
		resultado.error = e;
	}
	avisar({
		tipo: "resultado",
		...resultado
	});
	return resultado;
}
var enCurso = null;
var otraVez = null;
/** Sincroniza ahora (si ya hay una en curso, encadena otra al terminar). */
function sincronizar(opciones = {}) {
	if (enCurso) {
		otraVez = { completo: Boolean(otraVez?.completo || opciones.completo) };
		return enCurso;
	}
	enCurso = ciclo(opciones).finally(() => {
		enCurso = null;
		if (otraVez) {
			const o = otraVez;
			otraVez = null;
			sincronizar(o);
		}
	});
	return enCurso;
}
// src/lib/acciones.js
var ahoraIso = () => (/* @__PURE__ */ new Date()).toISOString();
function op(entidad, operacion, payload, ref, descripcion) {
	encolar({
		entidad,
		operacion,
		payload,
		ref,
		descripcion,
		usuarioId: app.user?.id
	});
}
/** Si hay señal, sincroniza ya y devuelve true si todo quedó confirmado por el servidor. */
async function enviar() {
	if (!app.online) return false;
	const r = await sincronizar();
	return !r.error && !r.rechazadas?.length;
}
function guardarLocal(col, item) {
	if (db.get(col, item.id)) db.update(col, item.id, item);
	else save(col, [item, ...db.list(col)]);
}
var solicitarCodigo = (celular) => post("/auth/otp/solicitar", { telefono: celular });
var verificarCodigo = (celular, codigo) => post("/auth/otp/verificar", {
	telefono: celular,
	codigo,
	plataforma: "web"
});
/** Crea la cuenta (con el token de registro que dejó verificarCodigo en la cookie). */
function registrar(draft, { sectorId, sectorNuevo, manzana }) {
	return post("/auth/registro", {
		nombre: draft.firstName,
		apellido: draft.lastName ?? "",
		manzana,
		...sectorNuevo ? { sector_nuevo: {
			id: uid(),
			nombre: sectorNuevo.name,
			manzanas: sectorNuevo.manzanas
		} } : { sector_id: sectorId },
		...draft.location ? {
			lat_aprox: draft.location.lat,
			lng_aprox: draft.location.lng
		} : {},
		...draft.address ? { direccion: draft.address } : {},
		idioma: app.settings.lang
	});
}
/** Deja la sesión abierta en este celular y descarga los datos del sector. */
async function entrar(usuarioDto, pantalla = "inicio") {
	guardarLocal("users", usuarioALocal(usuarioDto));
	app.startSession(usuarioDto.id, pantalla);
	await sincronizar({ completo: true });
}
function actualizarPerfil(patch) {
	const u = app.user;
	if (!u) return;
	db.update("users", u.id, patch);
	const dto = perfilADto(patch);
	if (Object.keys(dto).length) op("usuarios", "actualizar", dto, {
		col: "users",
		id: u.id
	}, "Cambio de tu perfil");
	return enviar();
}
function responderInvitacion(acepta) {
	const u = app.user;
	const s = app.sector;
	db.update("users", u.id, {
		inviteAnswered: acepta ? "aceptada" : "despues",
		...acepta ? { isGuardian: true } : {}
	});
	if (acepta && s) db.update("sectors", s.id, (x) => ({ guardianIds: [.../* @__PURE__ */ new Set([...x.guardianIds ?? [], u.id])] }));
	op("usuarios", "actualizar", {
		accion: "invitacion",
		respuesta: acepta ? "aceptada" : "despues"
	}, {
		col: "users",
		id: u.id
	}, "Respuesta a la invitación de Guardián");
	return enviar();
}
function guardarServicio(data, existente) {
	const u = app.user;
	if (existente) {
		db.update("services", existente.id, data);
		op("servicios", "actualizar", {
			id: existente.id,
			...servicioADto({
				...existente,
				...data
			}),
			actualizado_en: ahoraIso()
		}, {
			col: "services",
			id: existente.id
		}, `Editar "${data.titulo}"`);
	} else {
		const id = uid();
		db.create("services", {
			...data,
			id,
			ownerId: u.id,
			status: "pendiente",
			hidden: false,
			baseVistos: 0,
			baseTags: {}
		});
		op("servicios", "crear", {
			id,
			...servicioADto(data)
		}, {
			col: "services",
			id
		}, `Publicar "${data.titulo}"`);
	}
	return enviar();
}
/** "Escribir por WhatsApp": el servidor anota el contacto y devuelve el enlace (el número nunca se lista). */
async function contactarServicio(s) {
	const id = uid();
	if (app.online) try {
		const c = await post(`/servicios/${s.id}/contacto`, { id });
		guardarLocal("contacts", contactoALocal(c));
		if (c.whatsapp_url) abrirEnlace(c.whatsapp_url);
		return;
	} catch (e) {
		if (!(e instanceof ErrorApi) || !e.esDeRed) return app.notify(e.message);
	}
	if (!db.list("contacts").some((c) => c.serviceId === s.id && c.userId === app.user.id && !c.answered)) {
		db.create("contacts", {
			id,
			serviceId: s.id,
			userId: app.user.id,
			answered: false,
			attended: null
		});
		op("contactos", "crear", {
			id,
			servicio_id: s.id
		}, {
			col: "contacts",
			id
		}, `Contacto con ${s.titulo}`);
	}
	app.notify("Sin señal: WhatsApp necesita internet. Te avisaremos para recomendarlo cuando vuelva la conexión.");
}
function responderContacto(contacto, attended) {
	db.update("contacts", contacto.id, {
		answered: true,
		attended
	});
	op("contactos", "actualizar", {
		id: contacto.id,
		atendido: attended
	}, {
		col: "contacts",
		id: contacto.id
	}, "¿Te atendió?");
	return enviar();
}
function darVistoBueno(serviceId, tags, comment) {
	const id = uid();
	db.create("recommendations", {
		id,
		serviceId,
		userId: app.user.id,
		tags,
		comment
	});
	op("recomendaciones", "crear", {
		id,
		servicio_id: serviceId,
		etiquetas: tags,
		comentario: comment
	}, {
		col: "recommendations",
		id
	}, "Visto Bueno");
	return enviar();
}
function guardarFavor(data, existente) {
	const u = app.user;
	if (existente) {
		db.update("favors", existente.id, data);
		op("favores", "actualizar", {
			id: existente.id,
			...favorADto({
				...existente,
				...data
			}),
			actualizado_en: ahoraIso()
		}, {
			col: "favors",
			id: existente.id
		}, `Editar "${data.titulo}"`);
	} else {
		const id = uid();
		db.create("favors", {
			...data,
			id,
			ownerId: u.id,
			status: "pendiente",
			hidden: false,
			takerId: null,
			reservedAt: null,
			ownerConfirmed: false,
			takerConfirmed: false
		});
		op("favores", "crear", {
			id,
			...favorADto(data)
		}, {
			col: "favors",
			id
		}, `Publicar "${data.titulo}"`);
	}
	return enviar();
}
/** "Lo quiero / Puedo ayudar": reserva por 1 hora y gana el primero. Con señal se confirma al instante. */
async function reservarFavor(f) {
	if (app.online) try {
		const r = await post(`/favores/${f.id}/reservar`);
		guardarLocal("favors", favorALocal(r));
		if (r.whatsapp_url) abrirEnlace(r.whatsapp_url);
		app.notify("Se abrió WhatsApp. Queda reservado para ti por 1 hora.");
		return true;
	} catch (e) {
		if (!(e instanceof ErrorApi) || !e.esDeRed) {
			app.notify(e.message);
			sincronizar({ completo: true });
			return false;
		}
	}
	db.update("favors", f.id, {
		status: "reservado",
		takerId: app.user.id,
		reservedAt: Date.now(),
		ownerConfirmed: false,
		takerConfirmed: false
	});
	op("favores", "actualizar", {
		id: f.id,
		accion: "reservar"
	}, {
		col: "favors",
		id: f.id
	}, `Reservar "${f.titulo}"`);
	app.notify("🕓 Sin señal: tu reserva se enviará al volver la conexión (gana quien llegue primero).");
	return true;
}
/** Confirma un lado del favor. Si ambos confirmaron, queda "Cerrado y confirmado". Devuelve true si se cerró. */
function confirmarFavor(favor, lado) {
	const cambios = { [lado === "owner" ? "ownerConfirmed" : "takerConfirmed"]: true };
	const otro = lado === "owner" ? favor.takerConfirmed : favor.ownerConfirmed;
	if (otro) Object.assign(cambios, {
		status: "cerrado",
		closedAt: Date.now()
	});
	db.update("favors", favor.id, cambios);
	op("favores", "actualizar", {
		id: favor.id,
		accion: "listo"
	}, {
		col: "favors",
		id: favor.id
	}, `"Listo" en "${favor.titulo}"`);
	enviar();
	return Boolean(otro);
}
/** Enlace de WhatsApp con la otra persona de una reserva (lo entrega el servidor). */
async function whatsappFavor(f) {
	try {
		const d = await get(`/favores/${f.id}`);
		if (d.whatsapp_url) return abrirEnlace(d.whatsapp_url);
	} catch {}
	app.notify("WhatsApp necesita internet. Inténtalo cuando vuelva la señal.");
}
function reportar(col, targetId, motivo) {
	const id = uid();
	db.create("reports", {
		id,
		col,
		targetId,
		userId: app.user.id,
		reason: motivo
	});
	op("reportes", "crear", {
		id,
		objeto_tipo: OBJETO_DE_COLECCION[col],
		objeto_id: targetId,
		motivo: motivoACodigo(motivo)
	}, {
		col: "reports",
		id
	}, "Reporte de publicación");
	return enviar();
}
function moderar(g, aprobar) {
	db.remove("moderation", g.id);
	db.update(g.col, g.targetId, aprobar ? { hidden: false } : {
		hidden: true,
		status: "oculto"
	});
	op("moderacion", "crear", {
		objeto_tipo: OBJETO_DE_COLECCION[g.col],
		objeto_id: g.targetId,
		decision: aprobar ? "aprobar" : "ocultar"
	}, {
		col: g.col,
		id: g.targetId
	}, aprobar ? "Aprobar publicación" : "Ocultar publicación");
	return enviar();
}
function reportarEmergencia({ tipo, texto, foto }) {
	const u = app.user;
	const id = uid();
	const e = db.create("emergencies", {
		id,
		sectorId: u.sectorId,
		reporterId: u.id,
		tipo,
		texto,
		foto,
		manzana: u.manzana,
		status: "pendiente",
		acks: {},
		endSeen: {}
	});
	op("emergencias", "crear", {
		id,
		tipo,
		texto,
		foto
	}, {
		col: "emergencies",
		id
	}, "Reporte de emergencia");
	enviar();
	return e;
}
function confirmarEmergencia(e) {
	const u = app.user;
	db.update("emergencies", e.id, (x) => ({
		status: "activa",
		confirmedBy: u.id,
		confirmedAt: Date.now(),
		acks: {
			...x.acks ?? {},
			[u.id]: "visto"
		}
	}));
	op("emergencias", "actualizar", {
		id: e.id,
		accion: "confirmar"
	}, {
		col: "emergencies",
		id: e.id
	}, "Confirmar emergencia");
	return enviar();
}
function descartarEmergencia(e, motivo) {
	db.update("emergencies", e.id, {
		status: "descartada",
		motivo,
		reviewedBy: app.user.id,
		reviewedAt: Date.now()
	});
	op("emergencias", "actualizar", {
		id: e.id,
		accion: "descartar",
		motivo
	}, {
		col: "emergencies",
		id: e.id
	}, "Descartar reporte");
	return enviar();
}
function cerrarEmergencia(e) {
	const u = app.user;
	db.update("emergencies", e.id, (x) => ({
		status: "atendida",
		endedAt: Date.now(),
		closedBy: u.id,
		endSeen: {
			...x.endSeen ?? {},
			[u.id]: true
		}
	}));
	op("emergencias", "actualizar", {
		id: e.id,
		accion: "atender"
	}, {
		col: "emergencies",
		id: e.id
	}, "Marcar emergencia atendida");
	return enviar();
}
/** Mi respuesta a la alerta, si vi el fin de la emergencia y (si la reporté) si vi la respuesta del Guardián. */
function acusarEmergencia(e, { respuesta, finVisto, reporteroVisto }) {
	const u = app.user;
	db.update("emergencies", e.id, (x) => ({
		...respuesta ? { acks: {
			...x.acks ?? {},
			[u.id]: respuesta
		} } : {},
		...finVisto ? { endSeen: {
			...x.endSeen ?? {},
			[u.id]: true
		} } : {},
		...reporteroVisto ? { reporterSeen: true } : {}
	}));
	op("emergencia_acuses", "actualizar", {
		emergencia_id: e.id,
		...respuesta ? { respuesta } : {},
		...finVisto ? { fin_visto: true } : {},
		...reporteroVisto ? { reportero_visto: true } : {}
	}, {
		col: "emergencies",
		id: e.id
	}, "Respuesta a la alerta");
	return enviar();
}
function pedirAyuda(e, { necesidad, quienes, cuantas, texto, foto }) {
	const u = app.user;
	const id = uid();
	const n = db.create("needs", {
		id,
		emergencyId: e.id,
		ownerId: u.id,
		necesidad,
		quienes,
		cuantas,
		texto,
		foto,
		manzana: u.manzana,
		status: "abierto",
		helperId: null
	});
	op("pedidos_ayuda", "crear", {
		id,
		emergencia_id: e.id,
		necesidad,
		vulnerables: quienes,
		cuantas,
		texto,
		foto
	}, {
		col: "needs",
		id
	}, "Pedido de ayuda");
	enviar();
	return n;
}
function ayudarPedido(n) {
	db.update("needs", n.id, {
		status: "en_camino",
		helperId: app.user.id,
		helperAt: Date.now()
	});
	op("pedidos_ayuda", "actualizar", {
		id: n.id,
		accion: "ayudar"
	}, {
		col: "needs",
		id: n.id
	}, "\"Voy yo\"");
	return enviar();
}
function resolverPedido(n) {
	db.update("needs", n.id, {
		status: "resuelto",
		resolvedAt: Date.now()
	});
	op("pedidos_ayuda", "actualizar", {
		id: n.id,
		accion: "resolver"
	}, {
		col: "needs",
		id: n.id
	}, "Ayuda recibida");
	return enviar();
}
async function demo(ruta, body) {
	if (!app.online) {
		app.notify("Las herramientas de demostración necesitan conexión con el servidor.");
		return false;
	}
	try {
		await api("POST", ruta, body ?? {});
		await sincronizar({ completo: true });
		return true;
	} catch (e) {
		app.notify(e.message);
		return false;
	}
}
var demoGuardian = (activo) => demo("/demo/guardian", { activo });
var demoConfirmarOtro = (f) => demo(`/demo/favores/${f.id}/confirmar-otro`);
// src/lib/ui/Btn.svelte
function Btn($$renderer, $$props) {
	const BOTON = {
		primario: "bg-petroleo text-white",
		acento: "bg-morado text-white",
		rojo: "bg-rojo text-white",
		borde: "bg-white text-tinta border-2 border-linea",
		wa: "bg-wa text-white",
		blanco: "bg-white text-petroleo",
		bordeBlanco: "bg-transparent text-white border-2 border-white"
	};
	let { variant = "primario", class: clase = "", type = "button", children, $$slots, $$events, ...resto } = $$props;
	$$renderer.push(`<button${attributes({
		type,
		class: `flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl px-4 text-lg font-black leading-tight transition active:scale-[.98] disabled:opacity-40 disabled:active:scale-100 ${stringify(BOTON[variant])} ${stringify(clase)}`,
		...resto
	})}>`);
	children?.($$renderer);
	$$renderer.push(`<!----></button>`);
}
// src/lib/ui/H1.svelte
function H1($$renderer, $$props) {
	let { class: clase = "", children } = $$props;
	$$renderer.push(`<h1${attr_class(`text-2xl font-black leading-tight ${stringify(clase)}`)}>`);
	children?.($$renderer);
	$$renderer.push(`<!----></h1>`);
}
// src/lib/ui/Icon.svelte
function Icon($$renderer, $$props) {
	let { name, class: clase = "", $$slots, $$events, ...resto } = $$props;
	$$renderer.push(`<i${attributes({
		class: `fa-solid ${stringify(name)} ${stringify(clase)}`,
		"aria-hidden": "true",
		...resto
	})}></i>`);
}
// src/lib/ui/LangChip.svelte
function LangChip($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { class: clase = "" } = $$props;
		$$renderer.push(`<button type="button" aria-label="Cambiar idioma"${attr_class(`flex h-12 min-w-[72px] items-center justify-center gap-1 rounded-full border-[1.5px] border-linea bg-white px-3 text-sm font-extrabold text-tinta ${stringify(clase)}`)}>`);
		Icon($$renderer, { name: "fa-globe" });
		$$renderer.push(`<!----> ${escape_html(app.settings.lang.toUpperCase())}</button>`);
	});
}
// src/lib/ui/LinkBtn.svelte
function LinkBtn($$renderer, $$props) {
	let { class: clase = "", children, $$slots, $$events, ...resto } = $$props;
	$$renderer.push(`<button${attributes({
		type: "button",
		class: `min-h-[48px] w-full text-center text-sm font-extrabold text-petroleo underline-offset-4 hover:underline ${stringify(clase)}`,
		...resto
	})}>`);
	children?.($$renderer);
	$$renderer.push(`<!----></button>`);
}
// src/lib/ui/Screen.svelte
function Screen($$renderer, $$props) {
	let { class: clase = "", children } = $$props;
	$$renderer.push(`<div${attr_class(`flex flex-1 flex-col gap-4 px-5 pb-6 pt-4 ${stringify(clase)}`)}>`);
	children?.($$renderer);
	$$renderer.push(`<!----></div>`);
}
// src/lib/ui/Sub.svelte
function Sub($$renderer, $$props) {
	let { class: clase = "", children } = $$props;
	$$renderer.push(`<p${attr_class(`text-base font-semibold leading-snug text-gris ${stringify(clase)}`)}>`);
	children?.($$renderer);
	$$renderer.push(`<!----></p>`);
}
// src/lib/pantallas/acceso/Portada.svelte
function Portada($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let entrando = false;
		/** Demo: entra como Rosa (celular 900000001) pasando por el mismo OTP del servidor. */
		async function entrarComoRosa() {
			entrando = true;
			try {
				const r = await verificarCodigo("900000001", (await solicitarCodigo("900000001")).codigo_demo);
				if (r.tipo === "sesion") await entrar(r.usuario);
			} catch (e) {
				app.notify(e.message);
			} finally {
				entrando = false;
			}
		}
		Screen($$renderer, {
			class: "items-center pb-9 text-center",
			children: ($$renderer) => {
				$$renderer.push(`<div class="self-end">`);
				LangChip($$renderer, {});
				$$renderer.push(`<!----></div> <div class="flex flex-1 flex-col items-center justify-center gap-4"><img src="/logo.jpg" alt="AYNI" class="w-64 rounded-3xl"/> `);
				H1($$renderer, {
					children: ($$renderer) => {
						$$renderer.push(`<!---->${escape_html(app.t("lema"))}`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----> `);
				Sub($$renderer, {
					children: ($$renderer) => {
						$$renderer.push(`<!---->Servicios recomendados por tus vecinos, favores sin dinero y apoyo cuando más se necesita.`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----></div> `);
				Btn($$renderer, {
					onclick: () => app.go("tutorial"),
					children: ($$renderer) => {
						$$renderer.push(`<!---->${escape_html(app.t("crearCuenta"))}`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----> `);
				Btn($$renderer, {
					variant: "borde",
					onclick: () => app.go("telefono", { mode: "login" }),
					children: ($$renderer) => {
						$$renderer.push(`<!---->${escape_html(app.t("yaTengo"))}`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----> `);
				if (app.servidor.demo) {
					$$renderer.push("<!--[0-->");
					LinkBtn($$renderer, {
						onclick: entrarComoRosa,
						disabled: entrando,
						children: ($$renderer) => {
							$$renderer.push(`<!---->${escape_html(entrando ? "Entrando…" : "Entrar como vecina de prueba (Rosa)")}`);
						},
						$$slots: { default: true }
					});
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]-->`);
			},
			$$slots: { default: true }
		});
	});
}
// src/lib/pantallas/acceso/Tutorial.svelte
function Tutorial($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { desdePerfil = false } = $$props;
		const PASOS = [
			{
				emoji: "🤝",
				titulo: "Hoy por ti,\nmañana por mí",
				texto: "Encuentra gasfiteros, profes y más, recomendados por tus propios vecinos.",
				fondo: "bg-petroleo"
			},
			{
				emoji: "🔄",
				titulo: "Pide o presta\nsin dinero",
				texto: "Presta tu escalera, regala lo que te sobra o intercambia lo que sabes hacer.",
				fondo: "bg-petroleo"
			},
			{
				emoji: "🛡️",
				titulo: "En emergencias,\nnos cuidamos",
				texto: "Si pasa algo grave, AYNI cambia a modo emergencia para coordinar ayuda entre vecinos.",
				fondo: "bg-rojo"
			}
		];
		let paso = 0;
		const p = derived(() => PASOS[paso]);
		const terminar = () => desdePerfil ? app.back() : app.go("telefono", { mode: "registro" });
		$$renderer.push(`<div${attr_class(`flex flex-1 flex-col gap-6 px-7 pb-10 pt-5 text-white ${stringify(p().fondo)}`)}><button type="button" class="min-h-[48px] self-end text-base font-extrabold opacity-85">Saltar</button> <div class="flex h-64 items-center justify-center rounded-[32px] bg-white/15"><div class="flex h-28 w-28 items-center justify-center rounded-full bg-white text-6xl" aria-hidden="true">${escape_html(p().emoji)}</div></div> <div class="flex flex-col gap-3"><h1 class="whitespace-pre-line text-3xl font-black leading-tight">${escape_html(p().titulo)}</h1> <p class="text-lg font-semibold opacity-90">${escape_html(p().texto)}</p></div> <div class="flex-1"></div> <div class="flex justify-center gap-2"${attr("aria-label", `Paso ${stringify(paso + 1)} de 3`)}><!--[-->`);
		const each_array = ensure_array_like(PASOS);
		for (let i = 0, $$length = each_array.length; i < $$length; i++) {
			each_array[i];
			$$renderer.push(`<span${attr_class(`h-2.5 rounded-full ${i === paso ? "w-7 bg-white" : "w-2.5 bg-white/40"}`)}></span>`);
		}
		$$renderer.push(`<!--]--></div> `);
		Btn($$renderer, {
			variant: "blanco",
			class: paso === 2 ? "!text-rojo" : "",
			onclick: () => paso < 2 ? paso += 1 : terminar(),
			children: ($$renderer) => {
				$$renderer.push(`<!---->${escape_html(paso < 2 ? "Siguiente →" : desdePerfil ? "Listo" : "Empezar")}`);
			},
			$$slots: { default: true }
		});
		$$renderer.push(`<!----></div>`);
	});
}
// src/lib/ui/Header.svelte
function Header($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { title = "", right, onBack, light = false } = $$props;
		$$renderer.push(`<div class="-ml-2 flex items-center gap-1"><button type="button" aria-label="Volver"${attr_class(`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl font-black ${light ? "text-white active:bg-white/15" : "text-tinta active:bg-linea"}`)}>`);
		Icon($$renderer, {
			name: "fa-arrow-left",
			class: "text-2xl font-black"
		});
		$$renderer.push(`<!----></button> <div${attr_class(`min-w-0 flex-1 truncate text-base font-extrabold ${light ? "text-white" : "text-gris"}`)}>${escape_html(title)}</div> `);
		right?.($$renderer);
		$$renderer.push(`<!----></div>`);
	});
}
// src/lib/ui/Input.svelte
function Input($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { value = "", class: clase = "", $$slots, $$events, ...resto } = $$props;
		$$renderer.push(`<input${attributes({
			value,
			class: `w-full rounded-2xl border-2 border-linea bg-white px-4 text-base font-semibold text-tinta placeholder:text-gris/70 focus:border-morado focus:outline-none min-h-[52px] ${stringify(clase)}`,
			...resto
		}, void 0, void 0, void 0, 4)}/>`);
		bind_props($$props, { value });
	});
}
// src/lib/pantallas/acceso/Progreso.svelte
function Progreso($$renderer, $$props) {
	let { paso } = $$props;
	$$renderer.push(`<div class="flex gap-1.5"${attr("aria-label", `Paso ${stringify(paso)} de 4`)}><!--[-->`);
	const each_array = ensure_array_like([
		1,
		2,
		3,
		4
	]);
	for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
		let n = each_array[$$index];
		$$renderer.push(`<span${attr_class(`h-1.5 flex-1 rounded-full ${n <= paso ? "bg-petroleo" : "bg-linea"}`)}></span>`);
	}
	$$renderer.push(`<!--]--></div>`);
}
// src/lib/pantallas/acceso/Telefono.svelte
function Telefono($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { mode = "registro" } = $$props;
		let phone = load("registro", {}).phone ?? "";
		let error = "";
		let enviando = false;
		const valido = derived(() => /^9\d{8}$/.test(phone));
		async function continuar() {
			if (!app.online) return error = "Necesitas conexión para recibir el código SMS.";
			enviando = true;
			try {
				const r = await solicitarCodigo(phone);
				save("registro", {
					...load("registro", {}),
					phone,
					codigoDemo: r.codigo_demo ?? null
				});
				app.go("codigo", { mode });
			} catch (e) {
				error = e.message;
			} finally {
				enviando = false;
			}
		}
		Screen($$renderer, {
			children: ($$renderer) => {
				Header($$renderer, { title: mode === "registro" ? "Paso 1 de 4" : "Ingresar" });
				$$renderer.push(`<!----> `);
				if (mode === "registro") {
					$$renderer.push("<!--[0-->");
					Progreso($$renderer, { paso: 1 });
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> `);
				H1($$renderer, {
					children: ($$renderer) => {
						$$renderer.push(`<!---->${escape_html(mode === "registro" ? "¿Cuál es tu número de celular?" : "¡Hola de nuevo! 👋")}`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----> `);
				Sub($$renderer, {
					children: ($$renderer) => {
						$$renderer.push(`<!---->${escape_html(mode === "registro" ? "Te enviaremos un código por SMS para verificar que eres tú." : "Escribe tu número y te enviaremos un código para entrar. No necesitas contraseña.")}`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----> <div class="flex gap-2.5"><div class="flex min-h-[56px] w-24 items-center justify-center rounded-2xl border-2 border-linea bg-white font-bold">🇵🇪 +51</div> `);
				Input($$renderer, {
					type: "tel",
					inputmode: "numeric",
					autocomplete: "tel-national",
					"aria-label": "Número de celular",
					placeholder: "987 654 321",
					maxlength: 9,
					class: "min-h-[56px] flex-1 text-lg",
					value: phone,
					oninput: (e) => {
						error = "";
						phone = e.currentTarget.value.replace(/\D/g, "");
						e.currentTarget.value = phone;
					}
				});
				$$renderer.push(`<!----></div> `);
				if (error) $$renderer.push(`<!--[0--><p class="text-sm font-bold text-morado-osc">${escape_html(error)}</p>`);
				else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> <p class="text-sm font-semibold text-gris">🔒 Tus vecinos no verán tu número. Solo se usa para WhatsApp cuando tú lo decidas.</p> <div class="flex-1"></div> `);
				Btn($$renderer, {
					disabled: !valido() || enviando,
					onclick: continuar,
					children: ($$renderer) => {
						$$renderer.push(`<!---->${escape_html(enviando ? "Enviando…" : "Enviar código")}`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!---->`);
			},
			$$slots: { default: true }
		});
	});
}
// src/lib/pantallas/acceso/Codigo.svelte
function Codigo($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { mode = "registro" } = $$props;
		const draft = load("registro", {});
		let code = "";
		let error = "";
		let verificando = false;
		async function verificar() {
			verificando = true;
			try {
				const r = await verificarCodigo(draft.phone, code);
				if (r.tipo === "sesion") {
					if (mode === "registro") app.notify("Ese número ya tenía cuenta: entraste a AYNI.");
					await entrar(r.usuario);
					return;
				}
				if (mode === "login") app.notify("Aún no tienes cuenta con ese número: completa tu registro.");
				app.go("nombre");
			} catch (e) {
				error = e.message;
			} finally {
				verificando = false;
			}
		}
		Screen($$renderer, {
			children: ($$renderer) => {
				Header($$renderer, { title: mode === "registro" ? "Paso 2 de 4" : "Ingresar" });
				$$renderer.push(`<!----> `);
				if (mode === "registro") {
					$$renderer.push("<!--[0-->");
					Progreso($$renderer, { paso: 2 });
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> `);
				H1($$renderer, {
					children: ($$renderer) => {
						$$renderer.push(`<!---->Escribe el código`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----> `);
				Sub($$renderer, {
					children: ($$renderer) => {
						$$renderer.push(`<!---->Lo enviamos por SMS al +51 ${escape_html(draft.phone)}`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----> `);
				Input($$renderer, {
					inputmode: "numeric",
					autocomplete: "one-time-code",
					"aria-label": "Código de 4 dígitos",
					maxlength: 4,
					placeholder: "• • • •",
					class: "min-h-[64px] text-center text-3xl font-black tracking-[0.6em]",
					value: code,
					oninput: (e) => {
						error = "";
						code = e.currentTarget.value.replace(/\D/g, "");
						e.currentTarget.value = code;
					}
				});
				$$renderer.push(`<!----> `);
				if (error) $$renderer.push(`<!--[0--><p class="text-sm font-bold text-morado-osc">${escape_html(error)}</p>`);
				else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> `);
				if (draft.codigoDemo) $$renderer.push(`<!--[0--><div class="rounded-2xl bg-ambar-claro px-4 py-3 text-sm font-bold">🧪 Modo demostración: el código es ${escape_html(draft.codigoDemo)}. En producción llegaría por SMS.</div>`);
				else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> `);
				LinkBtn($$renderer, {
					onclick: app.back,
					children: ($$renderer) => {
						$$renderer.push(`<!---->Cambiar número`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----> <div class="flex-1"></div> `);
				Btn($$renderer, {
					disabled: code.length !== 4 || verificando,
					onclick: verificar,
					children: ($$renderer) => {
						$$renderer.push(`<!---->${escape_html(mode === "login" ? "Entrar" : "Verificar")}`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!---->`);
			},
			$$slots: { default: true }
		});
	});
}
// src/lib/ui/Avatar.svelte
function Avatar($$renderer, $$props) {
	let { letter = "", src = "/avatar-default.png", class: clase = "h-11 w-11 bg-ambar text-lg" } = $$props;
	$$renderer.push(`<img${attr("src", src)}${attr("alt", letter ? `Avatar ${letter}` : "Avatar")}${attr_class(`shrink-0 rounded-full object-cover ${stringify(clase)}`)}/>`);
}
// src/lib/ui/Field.svelte
function Field($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { label, hint = "", grupo = false, children } = $$props;
		const id = `campo-${Math.random().toString(36).slice(2, 9)}`;
		if (grupo) {
			$$renderer.push(`<!--[0--><div role="group"${attr("aria-labelledby", id)} class="flex flex-col gap-1.5"><div${attr("id", id)} class="text-sm font-extrabold text-gris">${escape_html(label)}</div> `);
			children?.($$renderer);
			$$renderer.push(`<!----> `);
			if (hint) $$renderer.push(`<!--[0--><span class="text-xs font-semibold text-gris">${escape_html(hint)}</span>`);
			else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
		} else {
			$$renderer.push(`<!--[-1--><label class="flex flex-col gap-1.5"><span class="text-sm font-extrabold text-gris">${escape_html(label)}</span> `);
			children?.($$renderer);
			$$renderer.push(`<!----> `);
			if (hint) $$renderer.push(`<!--[0--><span class="text-xs font-semibold text-gris">${escape_html(hint)}</span>`);
			else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></label>`);
		}
		$$renderer.push(`<!--]-->`);
	});
}
// src/lib/pantallas/acceso/Nombre.svelte
function Nombre($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const draft = load("registro", {});
		let firstName = draft.firstName ?? "";
		let lastName = draft.lastName ?? "";
		const valido = derived(() => firstName.trim().length >= 2 && lastName.trim().length >= 2);
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			Screen($$renderer, {
				children: ($$renderer) => {
					Header($$renderer, { title: "Paso 3 de 4" });
					$$renderer.push(`<!----> `);
					Progreso($$renderer, { paso: 3 });
					$$renderer.push(`<!----> `);
					H1($$renderer, {
						children: ($$renderer) => {
							$$renderer.push(`<!---->¿Cómo te llamas?`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					Sub($$renderer, {
						children: ($$renderer) => {
							$$renderer.push(`<!---->Así tus vecinos sabrán quién recomienda, presta o pide ayuda.`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					Field($$renderer, {
						label: "Nombre",
						children: ($$renderer) => {
							Input($$renderer, {
								autocomplete: "given-name",
								placeholder: "Rosa",
								get value() {
									return firstName;
								},
								set value($$value) {
									firstName = $$value;
									$$settled = false;
								}
							});
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					Field($$renderer, {
						label: "Apellido",
						children: ($$renderer) => {
							Input($$renderer, {
								autocomplete: "family-name",
								placeholder: "Mendoza",
								get value() {
									return lastName;
								},
								set value($$value) {
									lastName = $$value;
									$$settled = false;
								}
							});
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					if (valido()) {
						$$renderer.push(`<!--[0--><div class="flex flex-col gap-2 rounded-[20px] bg-petroleo-claro p-3.5"><div class="text-sm font-extrabold text-petroleo-osc">Así te verán tus vecinos:</div> <div class="flex items-center gap-3">`);
						Avatar($$renderer, {
							letter: firstName.trim()[0].toUpperCase(),
							class: "h-10 w-10 bg-ambar"
						});
						$$renderer.push(`<!----> <div><div class="font-black">${escape_html(nombreVisible({
							firstName: firstName.trim(),
							lastName
						}))}</div> <div class="text-xs font-semibold text-gris">Vecino(a) nuevo(a)</div></div></div></div>`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> <p class="text-sm font-semibold text-gris">🔒 Tu apellido completo no se muestra. Si ofreces un oficio, podrás elegir mostrarlo. No pedimos DNI.</p> <div class="flex-1"></div> `);
					Btn($$renderer, {
						disabled: !valido(),
						onclick: () => {
							save("registro", {
								...load("registro", {}),
								firstName: firstName.trim(),
								lastName: lastName.trim()
							});
							app.go("ubicacion");
						},
						children: ($$renderer) => {
							$$renderer.push(`<!---->Continuar`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!---->`);
				},
				$$slots: { default: true }
			});
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
	});
}
// src/lib/ui/Circle.svelte
function Circle($$renderer, $$props) {
	let { emoji, class: clase = "bg-petroleo-claro" } = $$props;
	$$renderer.push(`<div${attr_class(`mx-auto flex h-28 w-28 shrink-0 items-center justify-center rounded-full text-5xl ${stringify(clase)}`)} aria-hidden="true">${escape_html(emoji)}</div>`);
}
// src/lib/ui/TextArea.svelte
function TextArea($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { value = "", class: clase = "", $$slots, $$events, ...resto } = $$props;
		$$renderer.push(`<textarea${attributes({
			rows: "3",
			class: `w-full rounded-2xl border-2 border-linea bg-white px-4 text-base font-semibold text-tinta placeholder:text-gris/70 focus:border-morado focus:outline-none resize-none py-3 ${stringify(clase)}`,
			...resto
		})}>`);
		const $$body = escape_html(value);
		if ($$body) $$renderer.push(`${$$body}`);
		$$renderer.push(`</textarea>`);
		bind_props($$props, { value });
	});
}
// src/lib/pantallas/acceso/Ubicacion.svelte
function Ubicacion($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let manual = false;
		let address = load("registro", {}).address ?? "";
		let buscando = false;
		function permitir() {
			if (!navigator.geolocation) return manual = true;
			buscando = true;
			navigator.geolocation.getCurrentPosition((pos) => {
				const location = {
					lat: Number(pos.coords.latitude.toFixed(3)),
					lng: Number(pos.coords.longitude.toFixed(3))
				};
				save("registro", {
					...load("registro", {}),
					location
				});
				buscando = false;
				app.go("zona");
			}, () => {
				buscando = false;
				app.notify("No pudimos obtener tu ubicación. Elige tu zona en la lista.");
				app.go("zona");
			}, { timeout: 8e3 });
		}
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			Screen($$renderer, {
				children: ($$renderer) => {
					Header($$renderer, { title: "Paso 4 de 4" });
					$$renderer.push(`<!----> `);
					Progreso($$renderer, { paso: 4 });
					$$renderer.push(`<!----> `);
					Circle($$renderer, {
						emoji: "📍",
						class: "bg-petroleo-claro"
					});
					$$renderer.push(`<!----> `);
					H1($$renderer, {
						children: ($$renderer) => {
							$$renderer.push(`<!---->Activa tu ubicación`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					Sub($$renderer, {
						children: ($$renderer) => {
							$$renderer.push(`<!---->La usamos para mostrarte lo que hay cerca y confirmar que vives en el barrio.`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> <ul class="flex flex-col gap-2 text-[15px] font-bold"><li>✅ Solo usamos tu zona, nunca tu dirección exacta</li> <li>✅ Puedes cambiarla cuando quieras</li> <li>✅ En una emergencia ayuda a que te encuentren</li></ul> `);
					if (manual) {
						$$renderer.push("<!--[0-->");
						Field($$renderer, {
							label: "Tu dirección o una referencia",
							hint: "Solo la verán los Guardianes durante una emergencia.",
							children: ($$renderer) => {
								TextArea($$renderer, {
									placeholder: "Ej: Calle Los Pinos 123, frente al parque",
									get value() {
										return address;
									},
									set value($$value) {
										address = $$value;
										$$settled = false;
									}
								});
							},
							$$slots: { default: true }
						});
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> <div class="flex-1"></div> `);
					if (manual) {
						$$renderer.push("<!--[0-->");
						Btn($$renderer, {
							disabled: address.trim().length < 5,
							onclick: () => {
								save("registro", {
									...load("registro", {}),
									address: address.trim()
								});
								app.go("zona");
							},
							children: ($$renderer) => {
								$$renderer.push(`<!---->Continuar`);
							},
							$$slots: { default: true }
						});
					} else {
						$$renderer.push("<!--[-1-->");
						Btn($$renderer, {
							onclick: permitir,
							disabled: buscando,
							children: ($$renderer) => {
								$$renderer.push(`<!---->${escape_html(buscando ? "Buscando tu zona…" : "📍 Permitir ubicación")}`);
							},
							$$slots: { default: true }
						});
						$$renderer.push(`<!----> `);
						LinkBtn($$renderer, {
							onclick: () => manual = true,
							children: ($$renderer) => {
								$$renderer.push(`<!---->Prefiero escribir mi dirección`);
							},
							$$slots: { default: true }
						});
						$$renderer.push(`<!---->`);
					}
					$$renderer.push(`<!--]-->`);
				},
				$$slots: { default: true }
			});
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
	});
}
// src/lib/ui/Pills.svelte
function Pills($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { options, value, onChange, tone = "morado" } = $$props;
		const on = derived(() => tone === "rojo" ? "border-rojo bg-rojo text-white" : "border-morado bg-morado text-white");
		$$renderer.push(`<div class="flex flex-wrap gap-2"><!--[-->`);
		const each_array = ensure_array_like(options);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let o = each_array[$$index];
			const id = typeof o === "string" ? o : o.id;
			$$renderer.push(`<button type="button"${attr("aria-pressed", value === id)}${attr_class(`min-h-[48px] flex-1 rounded-2xl border-2 px-3 text-sm font-extrabold ${value === id ? on() : "border-linea bg-white text-tinta"}`)}>`);
			if (typeof o !== "string" && o.icon) {
				$$renderer.push("<!--[0-->");
				Icon($$renderer, { name: o.icon });
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> ${escape_html(typeof o === "string" ? o : o.label)}</button>`);
		}
		$$renderer.push(`<!--]--></div>`);
	});
}
// src/lib/pantallas/acceso/Zona.svelte
function Zona($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const draft = load("registro", {});
		let sectorId = datos.sectors[0]?.id ?? "";
		let manzana = "";
		let error = "";
		let enviando = false;
		const sector = derived(() => datos.sectors.find((s) => s.id === sectorId));
		async function confirmar() {
			enviando = true;
			try {
				const r = await registrar(draft, {
					sectorId,
					manzana
				});
				save("registro", {});
				await entrar(r.usuario, "bienvenida");
			} catch (e) {
				error = e.message;
			} finally {
				enviando = false;
			}
		}
		Screen($$renderer, {
			children: ($$renderer) => {
				Header($$renderer, { title: "Paso 4 de 4" });
				$$renderer.push(`<!----> `);
				Progreso($$renderer, { paso: 4 });
				$$renderer.push(`<!----> `);
				H1($$renderer, {
					children: ($$renderer) => {
						$$renderer.push(`<!---->📍 Elige tu zona`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----> `);
				Sub($$renderer, {
					children: ($$renderer) => {
						$$renderer.push(`<!---->${escape_html(draft.location ? "Estos sectores están cerca de tu ubicación." : "Elige el sector donde vives.")}`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----> <div class="flex flex-col gap-2" role="radiogroup"><!--[-->`);
				const each_array = ensure_array_like(datos.sectors);
				for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
					let s = each_array[$$index];
					$$renderer.push(`<button type="button" role="radio"${attr("aria-checked", sectorId === s.id)}${attr_class(`flex min-h-[56px] items-center justify-between rounded-2xl border-2 px-4 text-left font-bold ${sectorId === s.id ? "border-petroleo bg-petroleo-claro" : "border-linea bg-white"}`)}>${escape_html(s.name)} <span class="text-xs font-semibold text-gris">${escape_html(s.manzanas.length)} manzanas</span></button>`);
				}
				$$renderer.push(`<!--]--></div> `);
				if (sector()) {
					$$renderer.push(`<!--[0--><div class="text-sm font-extrabold text-gris">¿En qué manzana vives?</div> `);
					Pills($$renderer, {
						options: sector().manzanas.map((m) => ({
							id: m,
							label: `Mz. ${m}`
						})),
						value: manzana,
						onChange: (m) => manzana = m
					});
					$$renderer.push(`<!---->`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> `);
				if (error) $$renderer.push(`<!--[0--><p class="text-sm font-bold text-morado-osc">${escape_html(error)}</p>`);
				else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> `);
				LinkBtn($$renderer, {
					onclick: () => app.go("crearSector"),
					children: ($$renderer) => {
						$$renderer.push(`<!---->Mi sector no aparece: crearlo`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----> <div class="flex-1"></div> `);
				Btn($$renderer, {
					disabled: !sectorId || !manzana || enviando,
					onclick: confirmar,
					children: ($$renderer) => {
						$$renderer.push(`<!---->${escape_html(enviando ? "Creando tu cuenta…" : "Confirmar mi zona")}`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!---->`);
			},
			$$slots: { default: true }
		});
	});
}
// src/lib/pantallas/acceso/CrearSector.svelte
function CrearSector($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const LETRAS = "ABCDEFGHIJ".split("");
		let name = "";
		let cantidad = "6";
		let manzana = "";
		let error = "";
		let enviando = false;
		const letras = derived(() => LETRAS.slice(0, Number(cantidad)));
		async function crear() {
			enviando = true;
			try {
				const r = await registrar(load("registro", {}), {
					sectorNuevo: {
						name: name.trim(),
						manzanas: letras()
					},
					manzana
				});
				save("registro", {});
				await entrar(r.usuario, "primerGuardian");
			} catch (e) {
				error = e.message;
			} finally {
				enviando = false;
			}
		}
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			Screen($$renderer, {
				children: ($$renderer) => {
					Header($$renderer, { title: "Nuevo sector" });
					$$renderer.push(`<!----> <div class="rounded-[20px] bg-morado-claro p-4"><div class="text-lg font-black text-morado-osc">🧭 Tu zona aún no está en AYNI</div> <div class="text-sm font-semibold text-morado-osc">¡Sé el primero en abrirla! Tus vecinos podrán unirse después y tú serás su primer Guardián.</div></div> `);
					Field($$renderer, {
						label: "Nombre del sector",
						children: ($$renderer) => {
							Input($$renderer, {
								placeholder: "Ej: Los Jardines · Sector 3",
								get value() {
									return name;
								},
								set value($$value) {
									name = $$value;
									$$settled = false;
								}
							});
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					Field($$renderer, {
						label: "¿Cuántas manzanas tiene tu sector?",
						grupo: true,
						children: ($$renderer) => {
							Pills($$renderer, {
								options: [
									"4",
									"6",
									"8",
									"10"
								],
								value: cantidad,
								onChange: (v) => {
									cantidad = v;
									manzana = "";
								}
							});
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					Field($$renderer, {
						label: "¿En cuál vives?",
						grupo: true,
						children: ($$renderer) => {
							Pills($$renderer, {
								options: letras().map((m) => ({
									id: m,
									label: m
								})),
								value: manzana,
								onChange: (m) => manzana = m
							});
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					if (error) $$renderer.push(`<!--[0--><p class="text-sm font-bold text-morado-osc">${escape_html(error)}</p>`);
					else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> <div class="flex-1"></div> `);
					Btn($$renderer, {
						variant: "acento",
						disabled: name.trim().length < 3 || !manzana || enviando,
						onclick: crear,
						children: ($$renderer) => {
							$$renderer.push(`<!---->${escape_html(enviando ? "Creando…" : "Crear sector")}`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!---->`);
				},
				$$slots: { default: true }
			});
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
	});
}
// src/lib/ui/Chip.svelte
function Chip($$renderer, $$props) {
	let { class: clase = "bg-petroleo-claro text-petroleo-osc", children } = $$props;
	$$renderer.push(`<span${attr_class(`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold ${stringify(clase)}`)}>`);
	children?.($$renderer);
	$$renderer.push(`<!----></span>`);
}
// src/lib/pantallas/acceso/PrimerGuardian.svelte
function PrimerGuardian($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		Screen($$renderer, {
			class: "text-center",
			children: ($$renderer) => {
				$$renderer.push(`<div class="flex-1"></div> `);
				Circle($$renderer, {
					emoji: "🛡️",
					class: "bg-morado"
				});
				$$renderer.push(`<!----> <div>`);
				Chip($$renderer, {
					class: "bg-morado-claro text-morado-osc",
					children: ($$renderer) => {
						$$renderer.push(`<!---->Guardián fundador`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----></div> `);
				H1($$renderer, {
					children: ($$renderer) => {
						$$renderer.push(`<!---->¡Eres el primer Guardián de ${escape_html(app.sector?.name ?? "tu sector")}!`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----> `);
				Sub($$renderer, {
					children: ($$renderer) => {
						$$renderer.push(`<!---->Cuidarás que tu sector sea un lugar de confianza.`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----> <ul class="flex flex-col gap-2 rounded-[20px] border border-linea bg-white p-4 text-left text-[15px] font-bold"><li>✅ Confirmar o descartar emergencias</li> <li>✅ Avisar cuando la emergencia fue atendida</li> <li>✅ Revisar publicaciones reportadas</li></ul> <div class="flex-1"></div> `);
				Btn($$renderer, {
					onclick: () => app.go("bienvenida"),
					children: ($$renderer) => {
						$$renderer.push(`<!---->Entendido, continuar`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!---->`);
			},
			$$slots: { default: true }
		});
	});
}
// src/lib/pantallas/acceso/Bienvenida.svelte
function Bienvenida($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const vecinos = derived(() => app.sector?.totalVecinos || app.users.filter((u) => u.sectorId === app.user?.sectorId).length);
		$$renderer.push(`<div class="flex flex-1 flex-col items-center gap-4 bg-petroleo px-7 pb-10 pt-6 text-center text-white"><div class="flex-1"></div> `);
		Circle($$renderer, {
			emoji: "🎉",
			class: "bg-white"
		});
		$$renderer.push(`<!----> <h1 class="text-3xl font-black leading-tight">¡Bienvenido(a) a AYNI, ${escape_html(app.user?.firstName)}!</h1> `);
		Chip($$renderer, {
			class: "bg-white text-petroleo-osc",
			children: ($$renderer) => {
				$$renderer.push(`<!---->✅ Vecino(a) verificado(a)`);
			},
			$$slots: { default: true }
		});
		$$renderer.push(`<!----> <p class="text-lg font-semibold opacity-90">Ya eres parte de ${escape_html(app.sector?.name)}. ${escape_html(vecinos())} vecinos ya están aquí.</p> <div class="grid w-full grid-cols-3 gap-2.5"><!--[-->`);
		const each_array = ensure_array_like([
			["🔧", "Oficios"],
			["🤝", "Favores"],
			["🛡️", "Cuidarnos"]
		]);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let [e, l] = each_array[$$index];
			$$renderer.push(`<div class="flex flex-col items-center gap-1 rounded-2xl bg-white/15 p-3 text-sm font-extrabold"><span class="text-2xl" aria-hidden="true">${escape_html(e)}</span>${escape_html(l)}</div>`);
		}
		$$renderer.push(`<!--]--></div> <div class="flex-1"></div> `);
		Btn($$renderer, {
			variant: "blanco",
			onclick: () => app.reset("inicio"),
			children: ($$renderer) => {
				$$renderer.push(`<!---->Entrar a AYNI →`);
			},
			$$slots: { default: true }
		});
		$$renderer.push(`<!----></div>`);
	});
}
// src/lib/ui/ConnectionStatus.svelte
function ConnectionStatus($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const mias = derived(() => datos.outbox.filter((o) => o.usuarioId === app.user?.id));
		const pendientes = derived(() => mias().filter((o) => o.estado === "pendiente").length);
		const rechazadas = derived(() => mias().filter((o) => o.estado === "rechazada").length);
		if (app.online) {
			$$renderer.push(`<!--[0--><div class="flex items-center gap-2 text-xs font-bold text-gris"><span class="h-2.5 w-2.5 rounded-full bg-wa" aria-hidden="true"></span> ${escape_html(app.t("enLinea"))} `);
			if (pendientes() > 0) {
				$$renderer.push(`<!--[0--><span>· `);
				Icon($$renderer, { name: "fa-clock" });
				$$renderer.push(`<!----> ${escape_html(pendientes())} por enviar</span>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
		} else {
			$$renderer.push(`<!--[-1--><div role="status" class="rounded-xl border border-ambar bg-ambar-claro px-3 py-2 text-sm font-bold">`);
			Icon($$renderer, { name: "fa-wifi" });
			$$renderer.push(`<!----> ${escape_html(app.t("sinConexion"))} `);
			if (pendientes() > 0) $$renderer.push(`<!--[0--><span class="block text-xs">🕓 ${escape_html(pendientes())} cambio(s) se enviarán al volver la señal.</span>`);
			else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
		}
		$$renderer.push(`<!--]--> `);
		if (rechazadas() > 0) $$renderer.push(`<!--[0--><button type="button" class="rounded-xl border border-rojo bg-rojo-claro px-3 py-2 text-left text-sm font-bold text-rojo-osc">⚠️ ${escape_html(rechazadas())} cambio(s) no se pudieron enviar · Ver</button>`);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
// src/lib/ui/NumerosEmergencia.svelte
function NumerosEmergencia($$renderer) {
	$$renderer.push(`<div class="grid grid-cols-3 gap-2"><!--[-->`);
	const each_array = ensure_array_like(NUMEROS_EMERGENCIA);
	for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
		let n = each_array[$$index];
		$$renderer.push(`<a${attr("href", `tel:${stringify(n.numero)}`)} class="flex min-h-[52px] flex-col items-center justify-center rounded-2xl border-2 border-rojo bg-white text-rojo-osc"><span class="text-sm font-black">${escape_html(n.emoji)} ${escape_html(n.numero)}</span> <span class="text-[11px] font-bold">${escape_html(n.label)}</span></a>`);
	}
	$$renderer.push(`<!--]--></div>`);
}
// src/lib/pantallas/emergencia/InicioEmergencia.svelte
function InicioEmergencia($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const e = derived(() => app.activeEmergency);
		const tipo = derived(() => emergenciaById(e().tipo));
		const miPedido = derived(() => datos.needs.find((n) => n.emergencyId === e().id && n.ownerId === app.user.id && n.status !== "resuelto"));
		const abiertos = derived(() => datos.needs.filter((n) => n.emergencyId === e().id && n.status === "abierto").length);
		$$renderer.push(`<div class="flex flex-1 flex-col bg-rojo-fondo"><div class="flex flex-col gap-1 bg-rojo px-5 pb-4 pt-4 text-white"><div class="text-xl font-black">🚨 Emergencia activa: ${escape_html(tipo().label)}</div> <div class="text-sm font-semibold opacity-90">Confirmada por un Guardián ${escape_html(hace(e().confirmedAt))} · Mz. ${escape_html(e().manzana)} y alrededores</div></div> `);
		Screen($$renderer, {
			children: ($$renderer) => {
				if (miPedido()) $$renderer.push(`<!--[0--><button type="button" class="rounded-2xl border-2 border-rojo bg-white p-3 text-left text-sm font-extrabold text-rojo-osc">${escape_html(miPedido().status === "en_camino" ? "🙋 Alguien va en camino a ayudarte · Ver" : "⏳ Tu pedido de ayuda está publicado · Ver")}</button>`);
				else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> <div class="grid grid-cols-2 gap-3"><button type="button" class="flex h-32 flex-col items-center justify-center gap-1 rounded-3xl bg-rojo text-lg font-black text-white"><span class="text-4xl" aria-hidden="true">🆘</span>Necesito ayuda</button> <button type="button" class="flex h-32 flex-col items-center justify-center gap-1 rounded-3xl bg-petroleo text-lg font-black text-white"><span class="text-4xl" aria-hidden="true">💪</span>Puedo ayudar `);
				if (abiertos() > 0) $$renderer.push(`<!--[0--><span class="text-xs font-bold opacity-90">${escape_html(abiertos())} vecino(s) esperan</span>`);
				else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></button></div> <h2 class="text-lg font-black">Recursos cerca</h2> <div class="grid grid-cols-3 gap-2.5"><!--[-->`);
				const each_array = ensure_array_like(RECURSOS);
				for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
					let r = each_array[$$index];
					const n = datos.groups.filter((g) => g.recurso === r.id).length;
					$$renderer.push(`<button type="button" class="flex min-h-[80px] flex-col items-center justify-center rounded-2xl border border-linea bg-white p-2 text-xs font-extrabold"><span class="text-2xl" aria-hidden="true">${escape_html(r.emoji)}</span>${escape_html(r.label)} <span class="font-semibold text-gris">${escape_html(n ? `${n} punto(s)` : "Sin datos")}</span></button>`);
				}
				$$renderer.push(`<!--]--></div> <h2 class="text-lg font-black">Números de emergencia</h2> `);
				NumerosEmergencia($$renderer, {});
				$$renderer.push(`<!---->`);
			},
			$$slots: { default: true }
		});
		$$renderer.push(`<!----></div>`);
	});
}
// src/lib/ui/Sheet.svelte
function Sheet($$renderer, $$props) {
	let { onClose, children } = $$props;
	$$renderer.push(`<div class="fixed inset-0 z-40 flex items-end justify-center bg-petroleo-osc/70"><div role="dialog" aria-modal="true" tabindex="-1" class="flex max-h-[92dvh] w-full max-w-[430px] flex-col gap-3 overflow-y-auto rounded-t-[28px] bg-white px-5 pb-8 pt-3"><div class="mx-auto h-[5px] w-11 rounded-full bg-linea"></div> `);
	children?.($$renderer);
	$$renderer.push(`<!----></div></div>`);
}
// src/lib/pantallas/servicios/comun.js
/** Servicios visibles con su dueño, Vistos Buenos y distancia. Llamar dentro de $derived. */
function serviciosVisibles(user) {
	return datos.services.filter((s) => !s.hidden && (s.status === "disponible" || s.ownerId === user?.id && s.status !== "oculto")).map((s) => conDetalle(s, user));
}
function conDetalle(s, user) {
	let owner = datos.users.find((u) => u.id === s.ownerId);
	if (owner && s.showFullName && s.ownerName) owner = {
		...owner,
		lastName: s.ownerName.slice(owner.firstName.length).trim()
	};
	return {
		...s,
		owner,
		stats: statsServicio(s, datos.recommendations),
		dist: cuadras(user?.manzana, owner?.manzana)
	};
}
var ORDEN = {
	recomendados: (a, b) => b.stats.count - b.dist * 2 - (a.stats.count - a.dist * 2),
	cerca: (a, b) => a.dist - b.dist || b.stats.count - a.stats.count,
	vistos: (a, b) => b.stats.count - a.stats.count
};
// src/lib/pantallas/servicios/AtendioSheet.svelte
function AtendioSheet($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let omitidos = [];
		const contacto = derived(() => datos.contacts.find((c) => c.userId === app.user?.id && !c.answered && !omitidos.includes(c.id)));
		const s = derived(() => contacto() ? serviciosVisibles(app.user).find((x) => x.id === contacto().serviceId) : null);
		const omitir = () => omitidos = [...omitidos, contacto().id];
		if (contacto() && s()) {
			$$renderer.push("<!--[0-->");
			Sheet($$renderer, {
				onClose: omitir,
				children: ($$renderer) => {
					Circle($$renderer, {
						emoji: catById(s().categoria).emoji,
						class: "h-20 w-20 bg-ambar-claro !text-4xl"
					});
					$$renderer.push(`<!----> <h2 class="text-center text-xl font-black">¿Te atendió ${escape_html(nombreVisible(s().owner, true))}?</h2> <p class="text-center text-[15px] font-semibold text-gris">Le escribiste por WhatsApp ${escape_html(hace(contacto().createdAt))} por: ${escape_html(s().titulo)}.</p> `);
					Btn($$renderer, {
						onclick: () => {
							responderContacto(contacto(), true);
							app.go("vistoBueno", { id: s().id });
						},
						children: ($$renderer) => {
							$$renderer.push(`<!---->Sí, me atendió`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					Btn($$renderer, {
						variant: "borde",
						onclick: omitir,
						children: ($$renderer) => {
							$$renderer.push(`<!---->Todavía no`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					LinkBtn($$renderer, {
						class: "!text-gris",
						onclick: () => responderContacto(contacto(), false),
						children: ($$renderer) => {
							$$renderer.push(`<!---->No me atendió`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!---->`);
				},
				$$slots: { default: true }
			});
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
// src/lib/ui/Card.svelte
function Card($$renderer, $$props) {
	let { onclick, class: clase = "", children } = $$props;
	const base = derived(() => `flex w-full gap-3 rounded-[20px] border border-linea bg-white p-3.5 text-left ${clase}`);
	if (onclick) {
		$$renderer.push(`<!--[0--><button type="button"${attr_class(`${base()} transition active:scale-[.99]`)}>`);
		children?.($$renderer);
		$$renderer.push(`<!----></button>`);
	} else {
		$$renderer.push(`<!--[-1--><div${attr_class(clsx(base()))}>`);
		children?.($$renderer);
		$$renderer.push(`<!----></div>`);
	}
	$$renderer.push(`<!--]-->`);
}
// src/lib/ui/ChipPendiente.svelte
function ChipPendiente($$renderer) {
	Chip($$renderer, {
		class: "border border-dashed border-gris bg-white text-gris",
		children: ($$renderer) => {
			Icon($$renderer, { name: "fa-clock" });
			$$renderer.push(`<!----> Pendiente de enviar`);
		},
		$$slots: { default: true }
	});
}
// src/lib/pantallas/servicios/ServiceCard.svelte
function ServiceCard($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { s, onclick } = $$props;
		const cat = derived(() => catById(s.categoria));
		Card($$renderer, {
			onclick,
			children: ($$renderer) => {
				$$renderer.push(`<div class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-ambar-claro text-3xl" aria-hidden="true">`);
				if (s.foto) $$renderer.push(`<!--[0--><img${attr("src", s.foto)} alt="" class="h-full w-full object-cover"/>`);
				else $$renderer.push(`<!--[-1-->${escape_html(cat().emoji)}`);
				$$renderer.push(`<!--]--></div> <div class="flex min-w-0 flex-1 flex-col gap-1"><div class="text-base font-black leading-tight">${escape_html(nombreVisible(s.owner, s.showFullName))} · ${escape_html(s.titulo)}</div> <div class="text-sm font-semibold text-gris">📍 ${escape_html(cuadrasTxt(s.dist))} · ${escape_html(s.horario)}</div> <div class="flex flex-wrap gap-1">`);
				if (s.stats.count > 0) {
					$$renderer.push("<!--[0-->");
					Chip($$renderer, {
						class: "bg-morado-claro text-morado-osc",
						children: ($$renderer) => {
							$$renderer.push(`<!---->👍 ${escape_html(s.stats.count)}${escape_html(s.stats.topTags.slice(0, 2).map((t) => ` · ${etiquetaById(t.id)?.label}`).join(""))}`);
						},
						$$slots: { default: true }
					});
				} else {
					$$renderer.push("<!--[-1-->");
					Chip($$renderer, {
						class: "bg-linea text-gris",
						children: ($$renderer) => {
							$$renderer.push(`<!---->Nuevo en AYNI`);
						},
						$$slots: { default: true }
					});
				}
				$$renderer.push(`<!--]--> `);
				if (s.clase === "producto") {
					$$renderer.push("<!--[0-->");
					Chip($$renderer, {
						class: "bg-ambar-claro text-tinta",
						children: ($$renderer) => {
							$$renderer.push(`<!---->🛍️ Producto`);
						},
						$$slots: { default: true }
					});
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> `);
				if (s.status === "pendiente") {
					$$renderer.push("<!--[0-->");
					ChipPendiente($$renderer, {});
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> `);
				if (s.status === "pausado") {
					$$renderer.push("<!--[0-->");
					Chip($$renderer, {
						class: "bg-linea text-gris",
						children: ($$renderer) => {
							$$renderer.push(`<!---->⏸️ Pausado`);
						},
						$$slots: { default: true }
					});
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div></div>`);
			},
			$$slots: { default: true }
		});
	});
}
// src/lib/pantallas/servicios/Inicio.svelte
function Inicio($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let query = "";
		const top = derived(() => serviciosVisibles(app.user).filter((s) => s.ownerId !== app.user?.id).sort(ORDEN.recomendados).slice(0, 3));
		if (app.activeEmergency) {
			$$renderer.push("<!--[0-->");
			InicioEmergencia($$renderer, {});
		} else {
			$$renderer.push("<!--[-1-->");
			Screen($$renderer, {
				children: ($$renderer) => {
					$$renderer.push(`<div class="flex items-center justify-between gap-2"><div class="min-w-0"><div class="truncate text-sm font-bold text-gris">📍 ${escape_html(app.sector?.name)} · Mz. ${escape_html(app.user?.manzana)}</div> <h1 class="text-2xl font-black leading-tight">${escape_html(app.t("hola"))}, ${escape_html(app.user?.firstName)}! 👋</h1></div> <div class="flex shrink-0 items-center gap-2">`);
					LangChip($$renderer, {});
					$$renderer.push(`<!----> <button type="button" aria-label="Mi perfil">`);
					Avatar($$renderer, {
						letter: inicial(app.user),
						class: "h-12 w-12 bg-ambar text-lg"
					});
					$$renderer.push(`<!----></button></div></div> `);
					ConnectionStatus($$renderer, {});
					$$renderer.push(`<!----> <form role="search" class="flex min-h-[54px] items-center gap-2 rounded-2xl border-2 border-linea bg-white px-4 focus-within:border-morado"><span aria-hidden="true">`);
					Icon($$renderer, { name: "fa-magnifying-glass" });
					$$renderer.push(`<!----></span> <input${attr("aria-label", app.t("buscar"))}${attr("value", query)}${attr("placeholder", app.t("buscar"))} class="min-h-[50px] flex-1 bg-transparent text-base font-semibold placeholder:text-gris focus:outline-none"/></form> <button type="button" class="flex min-h-[52px] items-center gap-2 rounded-2xl border-2 border-dashed border-rojo bg-white px-4 text-left text-sm font-extrabold text-rojo">⚠️ ${escape_html(app.t("reportar"))}</button> <h2 class="text-lg font-black">${escape_html(app.t("oficios"))}</h2> <div class="grid grid-cols-4 gap-2.5"><!--[-->`);
					const each_array = ensure_array_like(CATEGORIAS.slice(0, 7));
					for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
						let c = each_array[$$index];
						$$renderer.push(`<button type="button" class="flex min-h-[80px] flex-col items-center justify-center gap-1 rounded-2xl border border-linea bg-white text-[11px] font-extrabold leading-tight"><span class="text-2xl" aria-hidden="true">${escape_html(c.emoji)}</span>${escape_html(c.label)}</button>`);
					}
					$$renderer.push(`<!--]--> <button type="button" class="flex min-h-[80px] flex-col items-center justify-center gap-1 rounded-2xl border border-linea bg-white text-[11px] font-extrabold"><span class="text-2xl" aria-hidden="true">`);
					Icon($$renderer, { name: "fa-plus" });
					$$renderer.push(`<!----></span>Ver todo</button></div> <div class="flex items-center justify-between"><h2 class="text-lg font-black">${escape_html(app.t("recomendados"))}</h2> <button type="button" class="min-h-[48px] px-1 text-sm font-extrabold text-petroleo">Ver mapa</button></div> <!--[-->`);
					const each_array_1 = ensure_array_like(top());
					for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
						let s = each_array_1[$$index_1];
						ServiceCard($$renderer, {
							s,
							onclick: () => app.go("servicio", { id: s.id })
						});
					}
					$$renderer.push(`<!--]--> <button type="button" class="flex items-center gap-3 rounded-[20px] border-2 border-morado bg-morado-claro p-4 text-left"><span class="text-3xl" aria-hidden="true">`);
					Icon($$renderer, { name: "fa-screwdriver-wrench" });
					$$renderer.push(`<!----></span> <span class="flex-1"><span class="block font-black text-morado-osc">¿Tienes un oficio o vendes algo?</span> <span class="block text-sm font-semibold text-morado-osc">Ofrécelo a tus vecinos en 3 clics.</span></span></button> `);
					AtendioSheet($$renderer, {});
					$$renderer.push(`<!---->`);
				},
				$$slots: { default: true }
			});
		}
		$$renderer.push(`<!--]-->`);
	});
}
// src/lib/ui/EmptyState.svelte
function EmptyState($$renderer, $$props) {
	let { emoji, title, children } = $$props;
	$$renderer.push(`<div class="flex flex-col items-center gap-2 rounded-[20px] border border-dashed border-linea bg-white px-5 py-8 text-center"><span class="text-4xl" aria-hidden="true">${escape_html(emoji)}</span> <div class="text-base font-black">${escape_html(title)}</div> `);
	if (children) {
		$$renderer.push(`<!--[0--><div class="text-sm font-semibold text-gris">`);
		children($$renderer);
		$$renderer.push(`<!----></div>`);
	} else $$renderer.push("<!--[-1-->");
	$$renderer.push(`<!--]--></div>`);
}
// src/lib/pantallas/servicios/Resultados.svelte
function Resultados($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { category, query = "" } = $$props;
		let orden = "recomendados";
		let q = query;
		const cat = derived(() => category ? catById(category) : null);
		const lista = derived(() => {
			const term = normalizar(q);
			return serviciosVisibles(app.user).filter((s) => !cat() || s.categoria === cat().id).filter((s) => !term || [
				s.titulo,
				s.descripcion,
				catById(s.categoria).label,
				s.owner?.firstName
			].some((v) => normalizar(v).includes(term))).sort(ORDEN[orden]);
		});
		Screen($$renderer, {
			class: "gap-3",
			children: ($$renderer) => {
				Header($$renderer, { title: "Resultados" });
				$$renderer.push(`<!----> `);
				H1($$renderer, {
					children: ($$renderer) => {
						$$renderer.push(`<!---->${escape_html(cat() ? `${cat().emoji} ${cat().label} cerca de ti` : "Servicios y productos del barrio")}`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----> <input aria-label="Buscar"${attr("value", q)} placeholder="🔍 Buscar por oficio o nombre" class="min-h-[52px] rounded-2xl border-2 border-linea bg-white px-4 font-semibold focus:border-morado focus:outline-none"/> <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Ordenar"><!--[-->`);
				const each_array = ensure_array_like([
					["recomendados", "⭐ Recomendados cerca"],
					["cerca", "📍 Más cercanos"],
					["vistos", "👍 Más recomendados"]
				]);
				for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
					let [id, label] = each_array[$$index];
					$$renderer.push(`<button type="button" role="radio"${attr("aria-checked", orden === id)}${attr_class(`min-h-[44px] rounded-full border-2 px-3 text-xs font-extrabold ${orden === id ? "border-petroleo bg-petroleo text-white" : "border-linea bg-white text-tinta"}`)}>${escape_html(label)}</button>`);
				}
				$$renderer.push(`<!--]--></div> <div class="text-sm font-semibold text-gris">${escape_html(lista().length)} resultado(s) en tu sector</div> <!--[-->`);
				const each_array_1 = ensure_array_like(lista());
				for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
					let s = each_array_1[$$index_1];
					ServiceCard($$renderer, {
						s,
						onclick: () => app.go("servicio", { id: s.id })
					});
				}
				$$renderer.push(`<!--]--> `);
				if (lista().length === 0) {
					$$renderer.push("<!--[0-->");
					EmptyState($$renderer, {
						emoji: "🔎",
						title: "Aún no hay nadie con ese oficio",
						children: ($$renderer) => {
							$$renderer.push(`<!---->Pídelo en la Cadena de Favores: quizá un vecino puede ayudarte. `);
							Btn($$renderer, {
								variant: "acento",
								class: "mt-3",
								onclick: () => app.go("publicar", { kind: "pido" }),
								children: ($$renderer) => {
									$$renderer.push(`<!---->Pedir ayuda a mis vecinos`);
								},
								$$slots: { default: true }
							});
							$$renderer.push(`<!---->`);
						},
						$$slots: { default: true }
					});
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]-->`);
			},
			$$slots: { default: true }
		});
	});
}
// src/lib/pantallas/servicios/PerfilServicio.svelte
function PerfilServicio($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { id } = $$props;
		const s = derived(() => serviciosVisibles(app.user).find((x) => x.id === id));
		const cat = derived(() => s() ? catById(s().categoria) : null);
		const mine = derived(() => s()?.ownerId === app.user.id);
		const atendido = derived(() => datos.contacts.some((c) => c.serviceId === id && c.userId === app.user.id && c.attended));
		const yaDio = derived(() => datos.recommendations.some((r) => r.serviceId === id && r.userId === app.user.id));
		function darVistoBueno() {
			if (yaDio()) return app.notify("Ya le diste tu Visto Bueno 💜");
			if (!atendido()) return app.notify("Podrás recomendarlo cuando te haya atendido. Primero escríbele por WhatsApp.");
			return app.go("vistoBueno", { id });
		}
		if (!s()) {
			$$renderer.push("<!--[0-->");
			Screen($$renderer, {
				children: ($$renderer) => {
					Header($$renderer, {});
					$$renderer.push(`<!----> `);
					EmptyState($$renderer, {
						emoji: "🙈",
						title: "Esta publicación ya no está disponible"
					});
					$$renderer.push(`<!---->`);
				},
				$$slots: { default: true }
			});
		} else {
			$$renderer.push(`<!--[-1--><div class="flex flex-1 flex-col"><div class="relative rounded-b-[28px] bg-petroleo px-5 pb-14 pt-3">`);
			{
				function right($$renderer) {
					if (!mine()) {
						$$renderer.push("<!--[0-->");
						LinkBtn($$renderer, {
							class: "!w-auto px-2 !text-white/90",
							onclick: () => app.go("reportar", {
								col: "services",
								id
							}),
							children: ($$renderer) => {
								Icon($$renderer, { name: "fa-flag" });
								$$renderer.push(`<!----> Reportar`);
							},
							$$slots: { default: true }
						});
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]-->`);
				}
				Header($$renderer, {
					light: true,
					right,
					$$slots: { right: true }
				});
			}
			$$renderer.push(`<!----> <div class="absolute -bottom-12 left-5 flex h-24 w-24 items-center justify-center overflow-hidden rounded-[28px] border-4 border-white bg-ambar text-5xl" aria-hidden="true">`);
			if (s().foto) $$renderer.push(`<!--[0--><img${attr("src", s().foto)} alt="" class="h-full w-full object-cover"/>`);
			else $$renderer.push(`<!--[-1-->${escape_html(cat().emoji)}`);
			$$renderer.push(`<!--]--></div></div> `);
			Screen($$renderer, {
				class: "pt-16",
				children: ($$renderer) => {
					$$renderer.push(`<div>`);
					H1($$renderer, {
						children: ($$renderer) => {
							$$renderer.push(`<!---->${escape_html(nombreVisible(s().owner, s().showFullName))}`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					Sub($$renderer, {
						children: ($$renderer) => {
							$$renderer.push(`<!---->${escape_html(s().titulo)} · ${escape_html(cat().label)} · 📍 ${escape_html(cuadrasTxt(s().dist))}`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----></div> <div>`);
					Chip($$renderer, {
						class: "bg-morado-claro px-4 py-2 text-sm text-morado-osc",
						children: ($$renderer) => {
							$$renderer.push(`<!---->✅ Visto Bueno Vecinal · ${escape_html(s().stats.count)} vecinos`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----></div> <p class="text-[15px] font-semibold">${escape_html(s().descripcion)}</p> <div class="grid grid-cols-2 gap-2.5"><div class="rounded-2xl border border-linea bg-white p-3 text-center"><div class="text-lg font-black">${escape_html(s().precio || "A tratar")}</div> <div class="text-xs font-bold text-gris">${escape_html(s().clase === "producto" ? "precio" : "desde")}</div></div> <div class="rounded-2xl border border-linea bg-white p-3 text-center"><div class="text-base font-black leading-tight">${escape_html(s().horario)}</div> <div class="text-xs font-bold text-gris">horario</div></div></div> `);
					if (s().stats.topTags.length > 0) {
						$$renderer.push(`<!--[0--><div class="flex flex-wrap gap-2"><!--[-->`);
						const each_array = ensure_array_like(s().stats.topTags);
						for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
							let tag = each_array[$$index];
							const e = etiquetaById(tag.id);
							if (e) {
								$$renderer.push("<!--[0-->");
								Chip($$renderer, {
									class: "bg-white text-tinta ring-1 ring-linea",
									children: ($$renderer) => {
										$$renderer.push(`<!---->${escape_html(e.emoji)} ${escape_html(e.label)} · ${escape_html(tag.count)}`);
									},
									$$slots: { default: true }
								});
							} else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]-->`);
						}
						$$renderer.push(`<!--]--></div>`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> `);
					if (s().stats.comentarios.length > 0) {
						$$renderer.push(`<!--[0--><h2 class="text-base font-black">Lo que dicen tus vecinos</h2> <!--[-->`);
						const each_array_1 = ensure_array_like(s().stats.comentarios.slice(0, 5));
						for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
							let r = each_array_1[$$index_1];
							const autor = datos.users.find((u) => u.id === r.userId);
							$$renderer.push(`<div class="rounded-2xl border border-linea bg-white p-3 text-sm"><b>${escape_html(nombreVisible(autor))}, Mz. ${escape_html(autor?.manzana)}</b> · “${escape_html(r.comment)}”</div>`);
						}
						$$renderer.push(`<!--]-->`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> <div class="flex-1"></div> `);
					if (mine()) {
						$$renderer.push("<!--[0-->");
						Btn($$renderer, {
							onclick: () => app.go("publicar", {
								editCol: "services",
								editId: id
							}),
							children: ($$renderer) => {
								$$renderer.push(`<!---->✏️ Editar mi publicación`);
							},
							$$slots: { default: true }
						});
					} else {
						$$renderer.push("<!--[-1-->");
						Btn($$renderer, {
							variant: "wa",
							onclick: () => contactarServicio(s()),
							children: ($$renderer) => {
								$$renderer.push(`<!---->💬 Escribir por WhatsApp`);
							},
							$$slots: { default: true }
						});
						$$renderer.push(`<!----> `);
						Btn($$renderer, {
							variant: "borde",
							onclick: darVistoBueno,
							children: ($$renderer) => {
								$$renderer.push(`<!---->${escape_html(yaDio() ? "💜 Ya lo recomendaste" : "👍 Dar mi Visto Bueno")}`);
							},
							$$slots: { default: true }
						});
						$$renderer.push(`<!----> <p class="text-center text-xs font-semibold text-gris">🔒 El número no se muestra; WhatsApp se abre con un mensaje listo.</p>`);
					}
					$$renderer.push(`<!--]-->`);
				},
				$$slots: { default: true }
			});
			$$renderer.push(`<!----></div>`);
		}
		$$renderer.push(`<!--]-->`);
	});
}
// src/lib/pantallas/servicios/DarVistoBueno.svelte
function DarVistoBueno($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { id } = $$props;
		let tags = [];
		let comment = "";
		const s = derived(() => serviciosVisibles(app.user).find((x) => x.id === id));
		const permitido = derived(() => s() && datos.contacts.some((c) => c.serviceId === id && c.userId === app.user.id && c.attended) && !datos.recommendations.some((r) => r.serviceId === id && r.userId === app.user.id));
		function enviar() {
			darVistoBueno(id, tags, comment.trim());
			app.replace("gracias", { id });
		}
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (!permitido()) {
				$$renderer.push("<!--[0-->");
				Screen($$renderer, {
					children: ($$renderer) => {
						Header($$renderer, {});
						$$renderer.push(`<!----> `);
						EmptyState($$renderer, {
							emoji: "🤝",
							title: "Aún no puedes recomendar este servicio",
							children: ($$renderer) => {
								$$renderer.push(`<!---->Solo pueden dar Visto Bueno los vecinos que fueron atendidos (y una sola vez).`);
							},
							$$slots: { default: true }
						});
						$$renderer.push(`<!---->`);
					},
					$$slots: { default: true }
				});
			} else {
				$$renderer.push("<!--[-1-->");
				Screen($$renderer, {
					children: ($$renderer) => {
						Header($$renderer, { title: "Elige de 1 a 6" });
						$$renderer.push(`<!----> <div class="flex items-center gap-3"><span class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-ambar-claro text-3xl" aria-hidden="true">${escape_html(catById(s().categoria).emoji)}</span> <div><div class="font-black">${escape_html(nombreVisible(s().owner, true))}</div> <div class="text-sm font-semibold text-gris">${escape_html(s().titulo)} · ${escape_html(cuadrasTxt(s().dist))}</div></div></div> `);
						H1($$renderer, {
							children: ($$renderer) => {
								$$renderer.push(`<!---->¿Qué destacas de ${escape_html(s().owner.firstName)}?`);
							},
							$$slots: { default: true }
						});
						$$renderer.push(`<!----> <div class="grid grid-cols-2 gap-2.5"><!--[-->`);
						const each_array = ensure_array_like(ETIQUETAS);
						for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
							let e = each_array[$$index];
							const on = tags.includes(e.id);
							$$renderer.push(`<button type="button"${attr("aria-pressed", on)}${attr_class(`flex min-h-[56px] items-center gap-2 rounded-2xl border-2 px-3 text-left text-sm font-extrabold ${on ? "border-morado bg-morado-claro text-morado-osc" : "border-linea bg-white"}`)}><span class="text-xl" aria-hidden="true">${escape_html(e.emoji)}</span> <span class="flex-1">${escape_html(e.label)}</span> `);
							if (on) $$renderer.push(`<!--[0--><span aria-hidden="true">✓</span>`);
							else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]--></button>`);
						}
						$$renderer.push(`<!--]--></div> <div class="text-sm font-bold text-morado-osc">${escape_html(tags.length)} de 6 elegidas</div> `);
						Field($$renderer, {
							label: "Comentario (opcional)",
							children: ($$renderer) => {
								TextArea($$renderer, {
									maxlength: 140,
									placeholder: "Ej: Llegó en 20 minutos y cobró lo justo.",
									get value() {
										return comment;
									},
									set value($$value) {
										comment = $$value;
										$$settled = false;
									}
								});
							},
							$$slots: { default: true }
						});
						$$renderer.push(`<!----> <p class="text-xs font-semibold text-gris">¿Tuviste una mala experiencia? No hay calificaciones negativas: usa “Reportar” y lo revisará un Guardián.</p> <div class="flex-1"></div> `);
						Btn($$renderer, {
							variant: "acento",
							disabled: tags.length === 0,
							onclick: enviar,
							children: ($$renderer) => {
								$$renderer.push(`<!---->👍 Dar mi Visto Bueno`);
							},
							$$slots: { default: true }
						});
						$$renderer.push(`<!---->`);
					},
					$$slots: { default: true }
				});
			}
			$$renderer.push(`<!--]-->`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
	});
}
// src/lib/pantallas/servicios/Gracias.svelte
function Gracias($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { id } = $$props;
		const s = derived(() => serviciosVisibles(app.user).find((x) => x.id === id));
		Screen($$renderer, {
			class: "text-center",
			children: ($$renderer) => {
				$$renderer.push(`<div class="flex-1"></div> `);
				Circle($$renderer, {
					emoji: "💜",
					class: "bg-morado-claro"
				});
				$$renderer.push(`<!----> `);
				H1($$renderer, {
					children: ($$renderer) => {
						$$renderer.push(`<!---->¡Gracias por recomendar!`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----> `);
				Sub($$renderer, {
					children: ($$renderer) => {
						$$renderer.push(`<!---->Tu Visto Bueno ayuda a tus vecinos a encontrar gente de confianza cerca de casa.`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----> `);
				if (s()) {
					$$renderer.push(`<!--[0--><div>`);
					Chip($$renderer, {
						class: "bg-morado-claro px-4 py-2 text-sm text-morado-osc",
						children: ($$renderer) => {
							$$renderer.push(`<!---->👍 Ahora ${escape_html(s().stats.count)} vecinos recomiendan a ${escape_html(s().owner.firstName)}`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----></div>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> <div class="flex-1"></div> `);
				Btn($$renderer, {
					onclick: () => app.reset("inicio"),
					children: ($$renderer) => {
						$$renderer.push(`<!---->Volver al inicio`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!---->`);
			},
			$$slots: { default: true }
		});
	});
}
// src/lib/pantallas/favores/comun.js
function detallesFavor(f) {
	const d = f.detalles ?? {};
	return ({
		presto: [["⏱️", d.duracion && `Por ${d.duracion.toLowerCase()}`], ["📝", d.condicion]],
		regalo: [["📦", d.estado], ["🔢", d.cantidad]],
		intercambio: [["🎁", d.ofrezco && `Ofrece: ${d.ofrezco}`], ["🔄", d.busco && `Busca: ${d.busco}`]],
		pido: [["🏷️", d.clase], ["📅", d.cuando && `Para: ${d.cuando.toLowerCase()}`]]
	}[f.tipo] ?? []).filter(([, v]) => v);
}
function minutosRestantes(f) {
	return Math.max(0, Math.ceil((RESERVA_MS - (Date.now() - (f.reservedAt ?? 0))) / 6e4));
}
// src/lib/pantallas/favores/EstadoChip.svelte
function EstadoChip($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { f, userId } = $$props;
		if (f.status === "pendiente") {
			$$renderer.push("<!--[0-->");
			ChipPendiente($$renderer, {});
		} else if (f.status === "reservado") {
			$$renderer.push("<!--[1-->");
			Chip($$renderer, {
				class: "bg-ambar-claro text-tinta",
				children: ($$renderer) => {
					$$renderer.push(`<!---->⏳ Reservado${escape_html(f.takerId === userId ? " para ti" : "")} · ${escape_html(minutosRestantes(f))} min`);
				},
				$$slots: { default: true }
			});
		} else if (f.status === "cerrado") {
			$$renderer.push("<!--[2-->");
			Chip($$renderer, {
				class: "bg-morado-claro text-morado-osc",
				children: ($$renderer) => {
					$$renderer.push(`<!---->✅ Cerrado y confirmado`);
				},
				$$slots: { default: true }
			});
		} else if (f.status === "oculto") {
			$$renderer.push("<!--[3-->");
			Chip($$renderer, {
				class: "bg-linea text-gris",
				children: ($$renderer) => {
					$$renderer.push(`<!---->🙈 Oculto por un Guardián`);
				},
				$$slots: { default: true }
			});
		} else {
			$$renderer.push("<!--[-1-->");
			Chip($$renderer, {
				class: "bg-petroleo-claro text-petroleo-osc",
				children: ($$renderer) => {
					$$renderer.push(`<!---->Disponible`);
				},
				$$slots: { default: true }
			});
		}
		$$renderer.push(`<!--]-->`);
	});
}
// src/lib/pantallas/favores/TipoChip.svelte
function TipoChip($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { tipo } = $$props;
		const t = derived(() => TIPOS_FAVOR[tipo]);
		Chip($$renderer, {
			class: t().chip,
			children: ($$renderer) => {
				$$renderer.push(`<!---->${escape_html(t().emoji)} ${escape_html(t().label)}`);
			},
			$$slots: { default: true }
		});
	});
}
// src/lib/pantallas/favores/FavorCard.svelte
function FavorCard($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { f, onclick, children } = $$props;
		const me = derived(() => app.user);
		const owner = derived(() => app.users.find((u) => u.id === f.ownerId));
		$$renderer.push(`<div${attr_class(`flex flex-col gap-2 rounded-[20px] border bg-white p-3.5 ${f.status === "pendiente" ? "border-dashed border-gris" : "border-linea"}`)}><button type="button" class="flex flex-col gap-2 text-left"><span class="flex w-full items-center justify-between gap-2">`);
		TipoChip($$renderer, { tipo: f.tipo });
		$$renderer.push(`<!----> <span class="text-xs font-semibold text-gris">${escape_html(hace(f.createdAt))}</span></span> <span class="flex w-full gap-3">`);
		if (f.foto) $$renderer.push(`<!--[0--><img${attr("src", f.foto)} alt="" class="h-14 w-14 shrink-0 rounded-xl object-cover"/>`);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <span class="text-base font-bold leading-snug">${escape_html(f.titulo)}</span></span> <span class="flex w-full flex-wrap items-center justify-between gap-2"><span class="text-sm font-semibold text-gris">${escape_html(f.ownerId === me().id ? "Tú" : nombreVisible(owner()))} · Mz. ${escape_html(owner()?.manzana)} · ${escape_html(cuadrasTxt(cuadras(me().manzana, owner()?.manzana)))}</span> `);
		if (f.status !== "disponible") {
			$$renderer.push("<!--[0-->");
			EstadoChip($$renderer, {
				f,
				userId: me().id
			});
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></span></button> `);
		children?.($$renderer);
		$$renderer.push(`<!----></div>`);
	});
}
// src/lib/pantallas/favores/Favores.svelte
function Favores($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const FILTROS = [
			{
				id: "todo",
				label: "Todo"
			},
			{
				id: "pido",
				label: "Pido"
			},
			{
				id: "presto",
				label: "Presto"
			},
			{
				id: "regalo",
				label: "Regalo"
			},
			{
				id: "intercambio",
				label: "Intercambio"
			}
		];
		let filtro = "todo";
		const visibles = derived(() => datos.favors.filter((f) => !f.hidden && (f.status === "disponible" || f.status === "reservado" || f.status === "pendiente" && f.ownerId === app.user.id)).filter((f) => true).sort((a, b) => b.createdAt - a.createdAt));
		Screen($$renderer, {
			class: "gap-3",
			children: ($$renderer) => {
				$$renderer.push(`<div>`);
				H1($$renderer, {
					children: ($$renderer) => {
						$$renderer.push(`<!---->${escape_html(app.t("favores"))} 🤝`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----> `);
				Sub($$renderer, {
					children: ($$renderer) => {
						$$renderer.push(`<!---->${escape_html(app.t("favoresSub"))}`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----></div> `);
				ConnectionStatus($$renderer, {});
				$$renderer.push(`<!----> <div class="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1" role="tablist"><!--[-->`);
				const each_array = ensure_array_like(FILTROS);
				for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
					let f = each_array[$$index];
					$$renderer.push(`<button type="button" role="tab"${attr("aria-selected", filtro === f.id)}${attr_class(`min-h-[44px] shrink-0 rounded-full border px-4 text-sm font-extrabold ${filtro === f.id ? "border-tinta bg-tinta text-white" : "border-linea bg-white"}`)}>${escape_html(f.label)}</button>`);
				}
				$$renderer.push(`<!--]--></div> <!--[-->`);
				const each_array_1 = ensure_array_like(visibles());
				for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
					let f = each_array_1[$$index_1];
					FavorCard($$renderer, {
						f,
						onclick: () => app.go("favor", { id: f.id })
					});
				}
				$$renderer.push(`<!--]--> `);
				if (visibles().length === 0) {
					$$renderer.push("<!--[0-->");
					EmptyState($$renderer, {
						emoji: "🌱",
						title: "Todavía no hay publicaciones aquí",
						children: ($$renderer) => {
							$$renderer.push(`<!---->Sé el primero: toca el botón + para pedir u ofrecer algo.`);
						},
						$$slots: { default: true }
					});
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]-->`);
			},
			$$slots: { default: true }
		});
	});
}
// src/lib/pantallas/favores/DetalleFavor.svelte
function DetalleFavor($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { id } = $$props;
		const f = derived(() => datos.favors.find((x) => x.id === id));
		const owner = derived(() => f() ? app.users.find((u) => u.id === f().ownerId) : null);
		const mine = derived(() => f()?.ownerId === app.user.id);
		const balance = derived(() => f() ? balanceAyni(f().ownerId, datos.favors) : {
			dados: 0,
			recibidos: 0
		});
		const verbo = derived(() => f()?.tipo === "pido" ? "Puedo ayudar" : "Lo quiero");
		if (!f()) {
			$$renderer.push("<!--[0-->");
			Screen($$renderer, {
				children: ($$renderer) => {
					Header($$renderer, {});
					$$renderer.push(`<!----> `);
					EmptyState($$renderer, {
						emoji: "🙈",
						title: "Esta publicación ya no está disponible"
					});
					$$renderer.push(`<!---->`);
				},
				$$slots: { default: true }
			});
		} else {
			$$renderer.push(`<!--[-1--><div class="flex flex-1 flex-col"><div class="flex h-44 items-center justify-center bg-ambar-claro text-7xl" aria-hidden="true">`);
			if (f().foto) $$renderer.push(`<!--[0--><img${attr("src", f().foto)} alt="" class="h-full w-full object-cover"/>`);
			else $$renderer.push(`<!--[-1-->${escape_html(TIPOS_FAVOR[f().tipo].emoji)}`);
			$$renderer.push(`<!--]--></div> `);
			Screen($$renderer, {
				children: ($$renderer) => {
					Header($$renderer, { title: mine() ? "Tu publicación" : "Cadena de Favores" });
					$$renderer.push(`<!----> <div class="flex flex-wrap gap-2">`);
					TipoChip($$renderer, { tipo: f().tipo });
					$$renderer.push(`<!----> `);
					EstadoChip($$renderer, {
						f: f(),
						userId: app.user.id
					});
					$$renderer.push(`<!----></div> `);
					H1($$renderer, {
						children: ($$renderer) => {
							$$renderer.push(`<!---->${escape_html(f().titulo)}`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					Sub($$renderer, {
						children: ($$renderer) => {
							$$renderer.push(`<!---->${escape_html(mine() ? "Publicado por ti" : nombreVisible(owner()))} · Mz. ${escape_html(owner()?.manzana)} · ${escape_html(cuadrasTxt(cuadras(app.user.manzana, owner()?.manzana)))} · ${escape_html(hace(f().createdAt))}`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> <div class="grid grid-cols-2 gap-2.5"><!--[-->`);
					const each_array = ensure_array_like(detallesFavor(f()));
					for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
						let [icono, texto] = each_array[$$index];
						$$renderer.push(`<div class="rounded-2xl border border-linea bg-white p-3 text-sm font-bold"><span class="block text-xl" aria-hidden="true">${escape_html(icono)}</span>${escape_html(texto)}</div>`);
					}
					$$renderer.push(`<!--]--></div> `);
					if (!mine()) $$renderer.push(`<!--[0--><div class="flex items-center gap-3 rounded-2xl bg-morado-claro p-3 text-sm font-extrabold text-morado-osc"><span class="text-xl" aria-hidden="true">🤝</span>${escape_html(owner()?.firstName)} ha dado ${escape_html(balance().dados)} favores y recibido ${escape_html(balance().recibidos)}</div>`);
					else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> <div class="flex-1"></div> `);
					if (mine()) {
						$$renderer.push("<!--[0-->");
						Btn($$renderer, {
							onclick: () => app.go("misPublicaciones"),
							children: ($$renderer) => {
								$$renderer.push(`<!---->Gestionar en Mis publicaciones`);
							},
							$$slots: { default: true }
						});
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> `);
					if (!mine() && f().status === "disponible") {
						$$renderer.push(`<!--[0--><p class="text-center text-sm font-semibold text-gris">Se abrirá WhatsApp con ${escape_html(owner()?.firstName)} y quedará reservado para ti por 1 hora.</p> `);
						Btn($$renderer, {
							onclick: () => reservarFavor(f()),
							children: ($$renderer) => {
								$$renderer.push(`<!---->🙋 ${escape_html(verbo())}`);
							},
							$$slots: { default: true }
						});
						$$renderer.push(`<!---->`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> `);
					if (!mine() && f().status === "reservado" && f().takerId === app.user.id) {
						$$renderer.push(`<!--[0--><div class="rounded-2xl border border-ambar bg-ambar-claro p-3 text-sm font-bold">⏳ Reservado para ti · se libera en ${escape_html(minutosRestantes(f()))} min si no se concreta.</div> `);
						if (f().takerConfirmed) $$renderer.push(`<!--[0--><p class="text-center text-sm font-bold text-gris">Ya confirmaste. Esperando que ${escape_html(owner()?.firstName)} toque “Listo”.</p>`);
						else {
							$$renderer.push("<!--[-1-->");
							Btn($$renderer, {
								onclick: () => {
									if (confirmarFavor(f(), "taker")) app.go("favorCerrado", { id: f().id });
									else app.notify(`¡Gracias! Falta que ${owner()?.firstName} confirme.`);
								},
								children: ($$renderer) => {
									$$renderer.push(`<!---->✅ Listo, ya se concretó`);
								},
								$$slots: { default: true }
							});
						}
						$$renderer.push(`<!--]--> `);
						Btn($$renderer, {
							variant: "borde",
							onclick: () => whatsappFavor(f()),
							children: ($$renderer) => {
								$$renderer.push(`<!---->💬 Escribir por WhatsApp`);
							},
							$$slots: { default: true }
						});
						$$renderer.push(`<!---->`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> `);
					if (!mine() && f().status === "reservado" && f().takerId !== app.user.id) $$renderer.push(`<!--[0--><p class="text-center text-sm font-bold text-gris">Otro vecino lo reservó. Si no se concreta en 1 hora, vuelve a estar disponible.</p>`);
					else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> `);
					if (!mine() && f().status !== "cerrado") {
						$$renderer.push("<!--[0-->");
						LinkBtn($$renderer, {
							class: "!text-gris",
							onclick: () => app.go("reportar", {
								col: "favors",
								id: f().id
							}),
							children: ($$renderer) => {
								$$renderer.push(`<!---->⚑ Reportar publicación`);
							},
							$$slots: { default: true }
						});
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]-->`);
				},
				$$slots: { default: true }
			});
			$$renderer.push(`<!----></div>`);
		}
		$$renderer.push(`<!--]-->`);
	});
}
// src/lib/ui/Segmented.svelte
function Segmented($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { options, value, onChange } = $$props;
		$$renderer.push(`<div class="flex gap-1 rounded-2xl bg-linea p-1" role="tablist"><!--[-->`);
		const each_array = ensure_array_like(options);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let o = each_array[$$index];
			$$renderer.push(`<button type="button" role="tab"${attr("aria-selected", value === o.id)}${attr_class(`min-h-[48px] flex-1 rounded-xl px-2 text-sm font-extrabold ${value === o.id ? "bg-white text-morado-osc shadow-sm" : "text-gris"}`)}>`);
			if (o.icon) {
				$$renderer.push("<!--[0-->");
				Icon($$renderer, { name: o.icon });
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> ${escape_html(o.label)}</button>`);
		}
		$$renderer.push(`<!--]--></div>`);
	});
}
// src/lib/pantallas/favores/MisPublicaciones.svelte
function MisPublicaciones($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let tab = "activas";
		const u = derived(() => app.user);
		const misServicios = derived(() => datos.services.filter((s) => s.ownerId === u().id && s.status !== "oculto").map((s) => conDetalle(s, u())));
		const activas = derived(() => datos.favors.filter((f) => f.ownerId === u().id && (f.status === "disponible" || f.status === "pendiente")));
		const reservadas = derived(() => datos.favors.filter((f) => f.status === "reservado" && (f.ownerId === u().id || f.takerId === u().id)));
		const cerradas = derived(() => datos.favors.filter((f) => f.status === "cerrado" && (f.ownerId === u().id || f.takerId === u().id)).sort((a, b) => b.closedAt - a.closedAt));
		const btn = "min-h-[44px] flex-1 rounded-xl border-2 border-linea bg-white px-2 text-xs font-extrabold";
		const otroDe = (f) => app.users.find((x) => x.id === (f.ownerId === u().id ? f.takerId : f.ownerId));
		const ladoDe = (f) => f.ownerId === u().id ? "owner" : "taker";
		async function simularOtro(f) {
			if (await demoConfirmarOtro(f)) app.go("favorCerrado", { id: f.id });
		}
		function acciones($$renderer, f) {
			if (f.status === "reservado") {
				$$renderer.push("<!--[0-->");
				const otro = otroDe(f);
				const lado = ladoDe(f);
				const yoConfirme = lado === "owner" ? f.ownerConfirmed : f.takerConfirmed;
				$$renderer.push(`<div class="flex flex-col gap-2 border-t border-linea pt-2"><div class="text-sm font-bold">${escape_html(lado === "owner" ? `Reservado por ${nombreVisible(otro)}` : `Lo reservaste a ${nombreVisible(otro)}`)}. ${escape_html(yoConfirme ? `Esperando a ${otro?.firstName}.` : "¿Ya se concretó?")}</div> <div class="flex gap-2">`);
				if (!yoConfirme) $$renderer.push(`<!--[0--><button type="button" class="min-h-[44px] flex-1 rounded-xl border-2 border-linea bg-white px-2 text-xs font-extrabold border-petroleo bg-petroleo text-white">✅ Listo</button>`);
				else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> `);
				if (lado === "owner") $$renderer.push(`<!--[0--><button type="button"${attr_class(clsx(btn))}>Liberar</button>`);
				else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div> `);
				if (yoConfirme && app.servidor.demo) {
					$$renderer.push("<!--[0-->");
					LinkBtn($$renderer, {
						class: "!min-h-[36px] !text-xs !text-gris",
						onclick: () => simularOtro(f),
						children: ($$renderer) => {
							$$renderer.push(`<!---->🧪 Demo: simular que ${escape_html(otro?.firstName)} también confirmó`);
						},
						$$slots: { default: true }
					});
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div>`);
			} else if (f.status !== "cerrado") $$renderer.push(`<!--[1--><div class="flex gap-2 border-t border-linea pt-2"><button type="button"${attr_class(clsx(btn))}>✏️ Editar</button> <button type="button"${attr_class(clsx(btn))}>🗑️ Eliminar</button></div>`);
			else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]-->`);
		}
		Screen($$renderer, {
			class: "gap-3",
			children: ($$renderer) => {
				Header($$renderer, { title: "Mi perfil" });
				$$renderer.push(`<!----> `);
				ConnectionStatus($$renderer, {});
				$$renderer.push(`<!----> `);
				H1($$renderer, {
					children: ($$renderer) => {
						$$renderer.push(`<!---->Mis publicaciones`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----> `);
				Segmented($$renderer, {
					options: [
						{
							id: "activas",
							label: `Activas (${activas().length + misServicios().length})`
						},
						{
							id: "reservadas",
							label: `Reservadas (${reservadas().length})`
						},
						{
							id: "cerradas",
							label: "Cerradas"
						}
					],
					value: tab,
					onChange: (v) => tab = v
				});
				$$renderer.push(`<!----> `);
				if (tab === "activas") {
					$$renderer.push("<!--[0-->");
					if (misServicios().length > 0) $$renderer.push(`<!--[0--><h2 class="text-sm font-extrabold text-gris">Mis servicios y productos</h2>`);
					else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> <!--[-->`);
					const each_array = ensure_array_like(misServicios());
					for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
						let s = each_array[$$index];
						$$renderer.push(`<div class="flex flex-col gap-2">`);
						ServiceCard($$renderer, {
							s,
							onclick: () => app.go("servicio", { id: s.id })
						});
						$$renderer.push(`<!----> <div class="flex gap-2"><button type="button"${attr_class(clsx(btn))}>✏️ Editar</button> <button type="button"${attr_class(clsx(btn))}>${escape_html(s.status === "pausado" ? "▶️ Activar" : "⏸️ Pausar")}</button> <button type="button"${attr_class(clsx(btn))}>🗑️ Eliminar</button></div></div>`);
					}
					$$renderer.push(`<!--]--> `);
					if (activas().length > 0) $$renderer.push(`<!--[0--><h2 class="text-sm font-extrabold text-gris">Mis favores</h2>`);
					else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> <!--[-->`);
					const each_array_1 = ensure_array_like(activas());
					for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
						let f = each_array_1[$$index_1];
						FavorCard($$renderer, {
							f,
							onclick: () => app.go("favor", { id: f.id }),
							children: ($$renderer) => {
								acciones($$renderer, f);
							},
							$$slots: { default: true }
						});
					}
					$$renderer.push(`<!--]--> `);
					if (activas().length + misServicios().length === 0) {
						$$renderer.push("<!--[0-->");
						EmptyState($$renderer, {
							emoji: "📭",
							title: "No tienes publicaciones activas",
							children: ($$renderer) => {
								$$renderer.push(`<!---->Toca + para ofrecer o pedir algo.`);
							},
							$$slots: { default: true }
						});
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]-->`);
				} else if (tab === "reservadas") {
					$$renderer.push("<!--[1-->");
					const each_array_2 = ensure_array_like(reservadas());
					if (each_array_2.length !== 0) {
						$$renderer.push("<!--[-->");
						for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
							let f = each_array_2[$$index_2];
							FavorCard($$renderer, {
								f,
								onclick: () => app.go("favor", { id: f.id }),
								children: ($$renderer) => {
									acciones($$renderer, f);
								},
								$$slots: { default: true }
							});
						}
					} else {
						$$renderer.push("<!--[!-->");
						EmptyState($$renderer, {
							emoji: "⏳",
							title: "Nada reservado por ahora"
						});
					}
					$$renderer.push(`<!--]-->`);
				} else {
					$$renderer.push("<!--[-1-->");
					const each_array_3 = ensure_array_like(cerradas());
					if (each_array_3.length !== 0) {
						$$renderer.push("<!--[-->");
						for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
							let f = each_array_3[$$index_3];
							FavorCard($$renderer, {
								f,
								onclick: () => app.go("favor", { id: f.id })
							});
						}
					} else {
						$$renderer.push("<!--[!-->");
						EmptyState($$renderer, {
							emoji: "🤝",
							title: "Aún no cierras favores"
						});
					}
					$$renderer.push(`<!--]-->`);
				}
				$$renderer.push(`<!--]-->`);
			},
			$$slots: { default: true }
		});
	});
}
// src/lib/pantallas/favores/FavorCerrado.svelte
function FavorCerrado($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { id } = $$props;
		const f = derived(() => datos.favors.find((x) => x.id === id));
		const otro = derived(() => app.users.find((u) => u.id === (f()?.ownerId === app.user.id ? f()?.takerId : f()?.ownerId)));
		const balance = derived(() => balanceAyni(app.user.id, datos.favors));
		Screen($$renderer, {
			class: "text-center",
			children: ($$renderer) => {
				$$renderer.push(`<div class="flex-1"></div> `);
				Circle($$renderer, {
					emoji: "🤝",
					class: "bg-morado-claro"
				});
				$$renderer.push(`<!----> `);
				H1($$renderer, {
					children: ($$renderer) => {
						$$renderer.push(`<!---->¡Favor cerrado y confirmado!`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----> `);
				Sub($$renderer, {
					children: ($$renderer) => {
						$$renderer.push(`<!---->Tú y ${escape_html(otro()?.firstName ?? "tu vecino")} confirmaron: ${escape_html(f()?.titulo)}.`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----> <div class="flex flex-col gap-3 rounded-3xl border-2 border-morado bg-white p-4"><div class="text-lg font-black text-morado-osc">Tu Balance de Ayni</div> <div class="grid grid-cols-2 gap-3"><div class="rounded-2xl bg-morado-claro p-3 text-morado-osc"><div class="text-3xl font-black">${escape_html(balance().dados)}</div><div class="text-xs font-extrabold">favores dados</div></div> <div class="rounded-2xl bg-morado-claro p-3 text-morado-osc"><div class="text-3xl font-black">${escape_html(balance().recibidos)}</div><div class="text-xs font-extrabold">favores recibidos</div></div></div> <div class="text-sm font-bold text-gris">Hoy por ti, mañana por mí 💜</div></div> <div class="flex-1"></div> `);
				Btn($$renderer, {
					onclick: () => app.reset("favores"),
					children: ($$renderer) => {
						$$renderer.push(`<!---->Volver a Favores`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!---->`);
			},
			$$slots: { default: true }
		});
	});
}
// src/lib/ui/PhotoPicker.svelte
function PhotoPicker($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { value, onChange } = $$props;
		$$renderer.push(`<div class="flex items-center gap-3">`);
		if (value) $$renderer.push(`<!--[0--><img${attr("src", value)} alt="Foto adjunta" class="h-14 w-14 rounded-xl object-cover"/>`);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <button type="button" class="min-h-[48px] rounded-full border-2 border-linea bg-white px-4 text-sm font-extrabold">`);
		Icon($$renderer, { name: "fa-camera" });
		$$renderer.push(`<!----> ${escape_html(value ? "Cambiar foto" : "Agregar foto (opcional)")}</button> `);
		if (value) $$renderer.push(`<!--[0--><button type="button" class="min-h-[48px] px-2 text-sm font-bold text-gris">Quitar</button>`);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <input type="file" accept="image/*" class="hidden"/></div>`);
	});
}
// src/lib/pantallas/publicar/Pie.svelte
function Pie($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { editando, valido, onclick } = $$props;
		let enviando = false;
		async function click() {
			enviando = true;
			try {
				await onclick();
			} finally {
				enviando = false;
			}
		}
		$$renderer.push(`<div class="flex-1"></div> `);
		Btn($$renderer, {
			variant: "acento",
			disabled: !valido || enviando,
			onclick: click,
			children: ($$renderer) => {
				$$renderer.push(`<!---->${escape_html(editando ? "Guardar cambios" : "Publicar ✓")}`);
			},
			$$slots: { default: true }
		});
		$$renderer.push(`<!---->`);
	});
}
// src/lib/pantallas/publicar/FormFavor.svelte
function FormFavor($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { item, onSave, onBack, editando } = $$props;
		const d = item?.detalles ?? {};
		let tipo = item?.tipo ?? "presto";
		let que = item && item.tipo !== "intercambio" ? item.titulo : "";
		let duracion = d.duracion ?? "1 día";
		let condicion = d.condicion ?? "";
		let estado = d.estado ?? "Usado";
		let cantidad = d.cantidad ?? "";
		let ofrezco = d.ofrezco ?? "";
		let busco = d.busco ?? "";
		let foto = item?.foto ?? null;
		const valido = derived(() => tipo === "intercambio" ? ofrezco.trim().length >= 3 && busco.trim().length >= 3 : que.trim().length >= 3);
		function publicar() {
			const base = {
				tipo,
				foto
			};
			if (tipo === "presto") return onSave("favors", {
				...base,
				titulo: que.trim(),
				detalles: {
					duracion,
					condicion: condicion.trim()
				}
			});
			if (tipo === "regalo") return onSave("favors", {
				...base,
				titulo: que.trim(),
				detalles: {
					estado,
					cantidad: cantidad.trim()
				}
			});
			return onSave("favors", {
				...base,
				titulo: `${ofrezco.trim()} a cambio de ${busco.trim()}`,
				detalles: {
					ofrezco: ofrezco.trim(),
					busco: busco.trim()
				}
			});
		}
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			Screen($$renderer, {
				class: "gap-3",
				children: ($$renderer) => {
					Header($$renderer, {
						title: editando ? "Editar" : "Clic 2 de 3",
						onBack
					});
					$$renderer.push(`<!----> `);
					H1($$renderer, {
						children: ($$renderer) => {
							$$renderer.push(`<!---->Ofrezco un favor`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					Segmented($$renderer, {
						options: [
							{
								id: "presto",
								label: "🔨 Presto"
							},
							{
								id: "regalo",
								label: "🎁 Regalo"
							},
							{
								id: "intercambio",
								label: "🔄 Intercambio"
							}
						],
						value: tipo,
						onChange: (v) => tipo = v
					});
					$$renderer.push(`<!----> `);
					if (tipo === "presto") {
						$$renderer.push("<!--[0-->");
						Field($$renderer, {
							label: "¿Qué prestas?",
							children: ($$renderer) => {
								Input($$renderer, {
									placeholder: "Ej: Escalera de 3 metros",
									get value() {
										return que;
									},
									set value($$value) {
										que = $$value;
										$$settled = false;
									}
								});
							},
							$$slots: { default: true }
						});
						$$renderer.push(`<!----> `);
						Field($$renderer, {
							label: "¿Por cuánto tiempo?",
							grupo: true,
							children: ($$renderer) => {
								Pills($$renderer, {
									options: [
										"Unas horas",
										"1 día",
										"Varios días"
									],
									value: duracion,
									onChange: (v) => duracion = v
								});
							},
							$$slots: { default: true }
						});
						$$renderer.push(`<!----> `);
						Field($$renderer, {
							label: "Condición (opcional)",
							children: ($$renderer) => {
								Input($$renderer, {
									placeholder: "Ej: Devolverla limpia, por favor 🙏",
									get value() {
										return condicion;
									},
									set value($$value) {
										condicion = $$value;
										$$settled = false;
									}
								});
							},
							$$slots: { default: true }
						});
						$$renderer.push(`<!---->`);
					} else if (tipo === "regalo") {
						$$renderer.push("<!--[1-->");
						Field($$renderer, {
							label: "¿Qué regalas?",
							children: ($$renderer) => {
								Input($$renderer, {
									placeholder: "Ej: Ladrillos y una bolsa de cemento",
									get value() {
										return que;
									},
									set value($$value) {
										que = $$value;
										$$settled = false;
									}
								});
							},
							$$slots: { default: true }
						});
						$$renderer.push(`<!----> `);
						Field($$renderer, {
							label: "¿En qué estado está?",
							grupo: true,
							children: ($$renderer) => {
								Pills($$renderer, {
									options: [
										"Nuevo",
										"Usado",
										"Sobrante"
									],
									value: estado,
									onChange: (v) => estado = v
								});
							},
							$$slots: { default: true }
						});
						$$renderer.push(`<!----> `);
						Field($$renderer, {
							label: "Cantidad (opcional)",
							children: ($$renderer) => {
								Input($$renderer, {
									placeholder: "Ej: 20 ladrillos, 1 bolsa",
									get value() {
										return cantidad;
									},
									set value($$value) {
										cantidad = $$value;
										$$settled = false;
									}
								});
							},
							$$slots: { default: true }
						});
						$$renderer.push(`<!---->`);
					} else {
						$$renderer.push("<!--[-1-->");
						Field($$renderer, {
							label: "Lo que ofrezco",
							children: ($$renderer) => {
								Input($$renderer, {
									placeholder: "Ej: Clases de Excel (2 horas)",
									get value() {
										return ofrezco;
									},
									set value($$value) {
										ofrezco = $$value;
										$$settled = false;
									}
								});
							},
							$$slots: { default: true }
						});
						$$renderer.push(`<!----> <div class="text-center text-2xl text-morado" aria-hidden="true">🔄</div> `);
						Field($$renderer, {
							label: "Lo que busco a cambio",
							children: ($$renderer) => {
								Input($$renderer, {
									placeholder: "Ej: Que me enseñen a hacer pan",
									get value() {
										return busco;
									},
									set value($$value) {
										busco = $$value;
										$$settled = false;
									}
								});
							},
							$$slots: { default: true }
						});
						$$renderer.push(`<!---->`);
					}
					$$renderer.push(`<!--]--> `);
					PhotoPicker($$renderer, {
						value: foto,
						onChange: (v) => foto = v
					});
					$$renderer.push(`<!----> `);
					Pie($$renderer, {
						editando,
						valido: valido(),
						onclick: publicar
					});
					$$renderer.push(`<!---->`);
				},
				$$slots: { default: true }
			});
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
	});
}
// src/lib/pantallas/publicar/FormPido.svelte
function FormPido($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { item, onSave, onBack, editando } = $$props;
		const d = item?.detalles ?? {};
		let clase = d.clase ?? "Favor";
		let texto = item?.titulo ?? "";
		let cuando = d.cuando ?? "Hoy";
		let foto = item?.foto ?? null;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			Screen($$renderer, {
				class: "gap-3",
				children: ($$renderer) => {
					Header($$renderer, {
						title: editando ? "Editar" : "Clic 2 de 3",
						onBack
					});
					$$renderer.push(`<!----> `);
					H1($$renderer, {
						children: ($$renderer) => {
							$$renderer.push(`<!---->¿Qué necesitas?`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					Sub($$renderer, {
						children: ($$renderer) => {
							$$renderer.push(`<!---->Se publica en la Cadena de Favores. Tus vecinos responden con “Puedo ayudar”.`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					Field($$renderer, {
						label: "Es un…",
						grupo: true,
						children: ($$renderer) => {
							Pills($$renderer, {
								options: [
									{
										id: "Producto",
										label: "Producto",
										icon: "fa-bag-shopping"
									},
									{
										id: "Servicio",
										label: "Servicio",
										icon: "fa-screwdriver-wrench"
									},
									{
										id: "Favor",
										label: "Favor",
										icon: "fa-handshake"
									}
								],
								value: clase,
								onChange: (v) => clase = v
							});
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					Field($$renderer, {
						label: "Cuéntalo en pocas palabras",
						children: ($$renderer) => {
							TextArea($$renderer, {
								maxlength: 160,
								placeholder: "Ej: Necesito que alguien me preste un taladro para colgar una repisa.",
								get value() {
									return texto;
								},
								set value($$value) {
									texto = $$value;
									$$settled = false;
								}
							});
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					Field($$renderer, {
						label: "¿Para cuándo?",
						grupo: true,
						children: ($$renderer) => {
							Pills($$renderer, {
								options: [
									"Hoy",
									"Esta semana",
									"Sin apuro"
								],
								value: cuando,
								onChange: (v) => cuando = v
							});
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					PhotoPicker($$renderer, {
						value: foto,
						onChange: (v) => foto = v
					});
					$$renderer.push(`<!----> `);
					Pie($$renderer, {
						editando,
						valido: texto.trim().length >= 5,
						onclick: () => onSave("favors", {
							tipo: "pido",
							titulo: texto.trim(),
							detalles: {
								clase,
								cuando
							},
							foto
						})
					});
					$$renderer.push(`<!---->`);
				},
				$$slots: { default: true }
			});
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
	});
}
// src/lib/ui/Select.svelte
function Select($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { value = void 0, class: clase = "", children, $$slots, $$events, ...resto } = $$props;
		$$renderer.select({
			value,
			class: `w-full rounded-2xl border-2 border-linea bg-white px-4 text-base font-semibold text-tinta focus:border-morado focus:outline-none min-h-[52px] ${stringify(clase)}`,
			...resto
		}, ($$renderer) => {
			children?.($$renderer);
			$$renderer.push(`<!---->`);
		}, void 0, void 0, void 0, void 0, true);
		bind_props($$props, { value });
	});
}
// src/lib/ui/Toggle.svelte
function Toggle($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { checked, onChange, label, hint = "" } = $$props;
		$$renderer.push(`<button type="button" role="switch"${attr("aria-checked", checked)} class="flex min-h-[56px] w-full items-center gap-3 text-left"><span class="flex-1"><span class="block text-base font-bold">${escape_html(label)}</span> `);
		if (hint) $$renderer.push(`<!--[0--><span class="block text-xs font-semibold text-gris">${escape_html(hint)}</span>`);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></span> <span${attr_class(`flex h-8 w-[52px] shrink-0 items-center rounded-full p-[3px] transition ${checked ? "justify-end bg-morado" : "justify-start bg-linea"}`)}><span class="h-[26px] w-[26px] rounded-full bg-white shadow"></span></span></button>`);
	});
}
// src/lib/pantallas/publicar/FormServicio.svelte
function FormServicio($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { item, onSave, onBack, editando } = $$props;
		let clase = item?.clase ?? "servicio";
		let categoria = item?.categoria ?? "gasfiteria";
		let titulo = item?.titulo ?? "";
		let descripcion = item?.descripcion ?? "";
		let horario = item?.horario ?? "";
		let precio = item?.precio ?? "";
		let foto = item?.foto ?? null;
		let showFullName = item?.showFullName ?? false;
		const valido = derived(() => titulo.trim().length >= 3 && descripcion.trim().length >= 10 && horario.trim().length >= 2);
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			Screen($$renderer, {
				class: "gap-3",
				children: ($$renderer) => {
					Header($$renderer, {
						title: editando ? "Editar" : "Clic 2 de 3",
						onBack
					});
					$$renderer.push(`<!----> `);
					H1($$renderer, {
						children: ($$renderer) => {
							$$renderer.push(`<!---->Ofrezco producto o servicio`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					Segmented($$renderer, {
						options: [{
							id: "servicio",
							label: "Servicio",
							icon: "fa-screwdriver-wrench"
						}, {
							id: "producto",
							label: "Producto",
							icon: "fa-bag-shopping"
						}],
						value: clase,
						onChange: (v) => clase = v
					});
					$$renderer.push(`<!----> `);
					Field($$renderer, {
						label: "Categoría",
						children: ($$renderer) => {
							Select($$renderer, {
								get value() {
									return categoria;
								},
								set value($$value) {
									categoria = $$value;
									$$settled = false;
								},
								children: ($$renderer) => {
									$$renderer.push(`<!--[-->`);
									const each_array = ensure_array_like(CATEGORIAS);
									for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
										let c = each_array[$$index];
										$$renderer.option({ value: c.id }, ($$renderer) => {
											$$renderer.push(`${escape_html(c.emoji)} ${escape_html(c.label)}`);
										});
									}
									$$renderer.push(`<!--]-->`);
								},
								$$slots: { default: true }
							});
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					Field($$renderer, {
						label: clase === "servicio" ? "¿Cómo te presentas? (nombre corto)" : "¿Qué vendes? (nombre corto)",
						children: ($$renderer) => {
							Input($$renderer, {
								maxlength: 40,
								placeholder: clase === "servicio" ? "Ej: Gasfitero" : "Ej: Panes caseros",
								get value() {
									return titulo;
								},
								set value($$value) {
									titulo = $$value;
									$$settled = false;
								}
							});
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					Field($$renderer, {
						label: "Describe lo que ofreces",
						children: ($$renderer) => {
							TextArea($$renderer, {
								maxlength: 200,
								placeholder: "Ej: Arreglo fugas, termas y desagües. 12 años de experiencia.",
								get value() {
									return descripcion;
								},
								set value($$value) {
									descripcion = $$value;
									$$settled = false;
								}
							});
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> <div class="grid grid-cols-2 gap-2.5">`);
					Field($$renderer, {
						label: "Horario",
						children: ($$renderer) => {
							Input($$renderer, {
								placeholder: "Lun–Sáb, 8am–6pm",
								get value() {
									return horario;
								},
								set value($$value) {
									horario = $$value;
									$$settled = false;
								}
							});
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					Field($$renderer, {
						label: "Precio desde (opcional)",
						children: ($$renderer) => {
							Input($$renderer, {
								placeholder: "S/ 30",
								get value() {
									return precio;
								},
								set value($$value) {
									precio = $$value;
									$$settled = false;
								}
							});
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----></div> `);
					PhotoPicker($$renderer, {
						value: foto,
						onChange: (v) => foto = v
					});
					$$renderer.push(`<!----> `);
					Toggle($$renderer, {
						checked: showFullName,
						onChange: (v) => showFullName = v,
						label: `Mostrar mi nombre completo (${stringify(app.user.firstName)} ${stringify(app.user.lastName)})`,
						hint: "Ayuda a que te encuentren y generen confianza"
					});
					$$renderer.push(`<!----> `);
					Pie($$renderer, {
						editando,
						valido: valido(),
						onclick: () => onSave("services", {
							clase,
							categoria,
							titulo: titulo.trim(),
							descripcion: descripcion.trim(),
							horario: horario.trim(),
							precio: precio.trim(),
							foto,
							showFullName
						})
					});
					$$renderer.push(`<!---->`);
				},
				$$slots: { default: true }
			});
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
	});
}
// src/lib/pantallas/publicar/Publicar.svelte
function Publicar($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { kind: kindInicial, editCol, editId } = $$props;
		const OPCIONES = [
			{
				id: "servicio",
				emoji: "🛠️",
				titulo: "Ofrezco producto o servicio",
				sub: "Tu oficio, profesión o lo que vendes",
				bg: "bg-ambar-claro"
			},
			{
				id: "favor",
				emoji: "🤝",
				titulo: "Ofrezco un favor",
				sub: "Presto, regalo o intercambio",
				bg: "bg-morado-claro"
			},
			{
				id: "pido",
				emoji: "🙋",
				titulo: "Necesito ayuda",
				sub: "Pide algo a tus vecinos",
				bg: "bg-petroleo-claro"
			}
		];
		const existente = editId ? db.get(editCol, editId) : null;
		const kindDe = (col, item) => !item ? null : col === "services" ? "servicio" : item.tipo === "pido" ? "pido" : "favor";
		let kind = kindDe(editCol, existente) ?? kindInicial ?? null;
		async function guardar(col, data) {
			const enviado = col === "services" ? await guardarServicio(data, existente) : await guardarFavor(data, existente);
			if (existente) app.notify(enviado ? "✅ Cambios guardados" : "🕓 Cambios guardados en tu celular. Se enviarán al volver la señal");
			else app.notify(enviado ? "✅ ¡Publicado! Tus vecinos ya lo pueden ver" : "🕓 Guardado. Se publicará cuando vuelvas a tener señal");
			app.replace("misPublicaciones");
		}
		const onBack = existente || kindInicial ? void 0 : () => kind = null;
		if (!kind) {
			$$renderer.push("<!--[0-->");
			Screen($$renderer, {
				children: ($$renderer) => {
					Header($$renderer, { title: "Clic 2 de 3" });
					$$renderer.push(`<!----> <div class="flex gap-1.5" aria-hidden="true"><span class="h-1.5 flex-1 rounded-full bg-morado"></span> <span class="h-1.5 flex-1 rounded-full bg-morado"></span> <span class="h-1.5 flex-1 rounded-full bg-linea"></span></div> `);
					H1($$renderer, {
						children: ($$renderer) => {
							$$renderer.push(`<!---->¿Qué quieres publicar?`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> <!--[-->`);
					const each_array = ensure_array_like(OPCIONES);
					for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
						let o = each_array[$$index];
						$$renderer.push(`<button type="button" class="flex min-h-[84px] items-center gap-3.5 rounded-[20px] border-2 border-linea bg-white p-4 text-left active:border-morado"><span${attr_class(`flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl text-2xl ${stringify(o.bg)}`)} aria-hidden="true">${escape_html(o.emoji)}</span> <span><span class="block text-base font-black">${escape_html(o.titulo)}</span> <span class="block text-sm font-semibold text-gris">${escape_html(o.sub)}</span></span></button>`);
					}
					$$renderer.push(`<!--]--> <p class="text-sm font-semibold text-gris">📍 Se usará tu zona: Mz. ${escape_html(app.user.manzana)}. Nunca tu dirección exacta.</p>`);
				},
				$$slots: { default: true }
			});
		} else if (kind === "servicio") {
			$$renderer.push("<!--[1-->");
			FormServicio($$renderer, {
				item: existente,
				onSave: guardar,
				onBack,
				editando: Boolean(existente)
			});
		} else if (kind === "favor") {
			$$renderer.push("<!--[2-->");
			FormFavor($$renderer, {
				item: existente,
				onSave: guardar,
				onBack,
				editando: Boolean(existente)
			});
		} else {
			$$renderer.push("<!--[-1-->");
			FormPido($$renderer, {
				item: existente,
				onSave: guardar,
				onBack,
				editando: Boolean(existente)
			});
		}
		$$renderer.push(`<!--]-->`);
	});
}
// src/lib/ui/EmergencyBanner.svelte
function EmergencyBanner($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { emergencia, tipo } = $$props;
		$$renderer.push(`<div class="bg-rojo px-5 pb-3 pt-3 text-sm font-extrabold text-white" role="status">`);
		Icon($$renderer, { name: "fa-triangle-exclamation" });
		$$renderer.push(`<!----> Modo emergencia · ${escape_html(tipo?.label ?? "Emergencia")} `);
		if (emergencia?.zona) $$renderer.push(`<!--[0--><span class="font-semibold opacity-90">· ${escape_html(emergencia.zona)}</span>`);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div>`);
	});
}
// src/lib/pantallas/Mapa.svelte
function Mapa($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let sel = null;
		const e = derived(() => app.activeEmergency);
		const manzanas = derived(() => app.sector?.manzanas ?? [
			"A",
			"B",
			"C",
			"D",
			"E",
			"F"
		]);
		const cols = derived(() => manzanas().length <= 4 ? 2 : 3);
		const ownerOf = (id) => app.users.find((u) => u.id === id);
		const pedidos = derived(() => e() ? datos.needs.filter((n) => n.emergencyId === e().id && n.status !== "resuelto") : []);
		const pins = derived(() => e() ? [...pedidos().map((n) => ({
			id: n.id,
			kind: "need",
			emoji: necesidadById(n.necesidad).emoji,
			manzana: n.manzana,
			cls: "bg-rojo",
			ring: true
		})), ...datos.groups.map((g) => ({
			id: g.id,
			kind: "group",
			emoji: g.emoji,
			manzana: g.manzana,
			cls: g.recurso === "agua" ? "bg-petroleo-osc" : "bg-petroleo"
		}))] : [...serviciosVisibles(app.user).map((s) => ({
			id: s.id,
			kind: "service",
			emoji: catById(s.categoria).emoji,
			manzana: s.owner?.manzana,
			cls: "bg-petroleo"
		})), ...datos.favors.filter((f) => !f.hidden && f.status === "disponible").map((f) => ({
			id: f.id,
			kind: "favor",
			emoji: TIPOS_FAVOR[f.tipo].emoji,
			manzana: ownerOf(f.ownerId)?.manzana,
			cls: "bg-morado"
		}))]);
		const miPos = derived(() => posicionPin(manzanas(), app.user.manzana, "yo", cols()));
		const seleccionado = derived(() => pins().find((p) => p.id === sel));
		const ordenados = derived(() => [...pedidos()].sort((a, b) => a.id === sel ? -1 : b.id === sel ? 1 : a.status === "abierto" ? -1 : 1));
		function vengoYo(n) {
			ayudarPedido(n);
			app.notify(`🙋 Avisamos a ${ownerOf(n.ownerId)?.firstName} que vas en camino`);
		}
		const direccion = (d) => [
			d.direccion,
			d.referencia,
			d.distrito
		].filter(Boolean).join(" · ") || (d.lat_aprox != null ? `${d.lat_aprox}, ${d.lng_aprox}` : "");
		$$renderer.push(`<div${attr_class(`flex flex-1 flex-col ${e() ? "bg-rojo-fondo" : ""}`)}>`);
		if (e()) {
			$$renderer.push("<!--[0-->");
			EmergencyBanner($$renderer, {
				emergencia: e(),
				tipo: emergenciaById(e().tipo)
			});
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <div class="relative mx-5 mt-4 h-[340px] overflow-hidden rounded-3xl bg-mapa" role="img" aria-label="Mapa del sector por manzanas"><div${attr_class(`absolute inset-3 grid gap-3 ${cols() === 3 ? "grid-cols-3" : "grid-cols-2"}`)}><!--[-->`);
		const each_array = ensure_array_like(manzanas());
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let m = each_array[$$index];
			$$renderer.push(`<div${attr_class(`flex items-start justify-start rounded-lg p-1.5 text-[11px] font-extrabold ${m === app.user.manzana ? "bg-petroleo-claro text-petroleo-osc" : "bg-manzana text-gris"}`)}>Mz. ${escape_html(m)}</div>`);
		}
		$$renderer.push(`<!--]--></div> <span class="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-[#2F80ED] shadow-[0_0_0_8px_rgba(47,128,237,.2)]"${attr_style(`left: ${stringify(miPos().left)}%; top: ${stringify(miPos().top)}%`)} aria-label="Tú estás aquí"></span> <!--[-->`);
		const each_array_1 = ensure_array_like(pins());
		for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
			let p = each_array_1[$$index_1];
			const pos = posicionPin(manzanas(), p.manzana, p.id, cols());
			$$renderer.push(`<button type="button" aria-label="Ver detalle" class="absolute -translate-x-1/2 -translate-y-1/2"${attr_style(`left: ${stringify(pos.left)}%; top: ${stringify(pos.top)}%`)}>`);
			if (p.ring) $$renderer.push(`<!--[0--><span class="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-rojo bg-rojo/15"></span>`);
			else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <span${attr_class(`relative flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-white text-lg shadow-md ${stringify(p.cls)} ${sel === p.id ? "scale-125" : ""}`)}>${escape_html(p.emoji)}</span></button>`);
		}
		$$renderer.push(`<!--]--> `);
		if (e()) $$renderer.push(`<!--[0--><span class="absolute right-3 top-3 rounded-xl bg-white px-2.5 py-1.5 text-xs font-extrabold">🔒 Zona aproximada</span>`);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div> `);
		Screen($$renderer, {
			class: "gap-3",
			children: ($$renderer) => {
				$$renderer.push(`<div class="flex flex-wrap gap-3 text-xs font-extrabold">`);
				if (e()) $$renderer.push(`<!--[0--><span><span class="mr-1 inline-block h-3 w-3 rounded-full bg-rojo align-[-1px]"></span>Necesitan ayuda (${escape_html(pedidos().filter((n) => n.status === "abierto").length)})</span> <span><span class="mr-1 inline-block h-3 w-3 rounded-full bg-petroleo align-[-1px]"></span>Apoyo (${escape_html(datos.groups.length)})</span>`);
				else $$renderer.push(`<!--[-1--><span><span class="mr-1 inline-block h-3 w-3 rounded-full bg-petroleo align-[-1px]"></span>Servicios</span> <span><span class="mr-1 inline-block h-3 w-3 rounded-full bg-morado align-[-1px]"></span>Favores</span> <span><span class="mr-1 inline-block h-3 w-3 rounded-full bg-[#2F80ED] align-[-1px]"></span>Tú</span>`);
				$$renderer.push(`<!--]--></div> `);
				if (!e() && seleccionado()) {
					$$renderer.push("<!--[0-->");
					Btn($$renderer, {
						variant: seleccionado().kind === "favor" ? "acento" : "primario",
						onclick: () => app.go(seleccionado().kind === "favor" ? "favor" : "servicio", { id: seleccionado().id }),
						children: ($$renderer) => {
							$$renderer.push(`<!---->${escape_html(seleccionado().emoji)} Ver ${escape_html(seleccionado().kind === "favor" ? "favor" : "servicio")}`);
						},
						$$slots: { default: true }
					});
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> `);
				if (!e() && !seleccionado()) $$renderer.push(`<!--[0--><p class="text-sm font-semibold text-gris">Toca un punto del mapa para ver de qué se trata.</p>`);
				else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> `);
				if (e()) {
					$$renderer.push("<!--[0-->");
					H1($$renderer, {
						class: "!text-xl",
						children: ($$renderer) => {
							$$renderer.push(`<!---->Vecinos que necesitan ayuda`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					if (pedidos().length === 0) $$renderer.push(`<!--[0--><div class="rounded-2xl border border-linea bg-white p-4 font-semibold text-gris">🙌 Nadie ha pedido ayuda todavía.</div>`);
					else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> <!--[-->`);
					const each_array_2 = ensure_array_like(ordenados());
					for (let $$index_3 = 0, $$length = each_array_2.length; $$index_3 < $$length; $$index_3++) {
						let n = each_array_2[$$index_3];
						const nec = necesidadById(n.necesidad);
						const helper = ownerOf(n.helperId);
						const mio = n.ownerId === app.user.id;
						$$renderer.push(`<div${attr_class(`flex flex-col gap-2 rounded-[20px] border-2 bg-white p-3.5 ${n.id === sel ? "border-rojo" : "border-linea"}`)}><div class="flex items-center gap-3"><span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rojo-claro text-2xl" aria-hidden="true">${escape_html(nec.emoji)}</span> <div class="min-w-0 flex-1"><div class="font-black">${escape_html(nec.label)} · ${escape_html(n.cuantas)} persona(s)</div> <div class="text-sm font-semibold text-gris">Zona Mz. ${escape_html(n.manzana)} · ${escape_html(hace(n.createdAt))}</div></div></div> `);
						if (n.quienes.length > 0) {
							$$renderer.push(`<!--[0--><div class="flex flex-wrap gap-1"><!--[-->`);
							const each_array_3 = ensure_array_like(n.quienes);
							for (let $$index_2 = 0, $$length = each_array_3.length; $$index_2 < $$length; $$index_2++) {
								let q = each_array_3[$$index_2];
								const v = VULNERABLES.find((x) => x.id === q);
								Chip($$renderer, {
									class: "bg-rojo-claro text-rojo-osc",
									children: ($$renderer) => {
										$$renderer.push(`<!---->${escape_html(v?.emoji)} ${escape_html(v?.label)}`);
									},
									$$slots: { default: true }
								});
							}
							$$renderer.push(`<!--]--></div>`);
						} else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]--> `);
						if (n.texto) $$renderer.push(`<!--[0--><p class="text-sm font-semibold">“${escape_html(n.texto)}”</p>`);
						else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]--> `);
						if (app.isGuardian && n.direccionExacta && direccion(n.direccionExacta)) $$renderer.push(`<!--[0--><p class="rounded-xl bg-morado-claro p-2 text-xs font-bold text-morado-osc">🛡️ Solo Guardianes · ${escape_html(direccion(n.direccionExacta))}</p>`);
						else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]--> `);
						if (mio) {
							$$renderer.push("<!--[0-->");
							Btn($$renderer, {
								variant: "borde",
								class: "!min-h-[48px] !text-base",
								onclick: () => app.go("miPedido", { id: n.id }),
								children: ($$renderer) => {
									$$renderer.push(`<!---->Ver mi pedido`);
								},
								$$slots: { default: true }
							});
						} else if (n.status === "abierto") {
							$$renderer.push("<!--[1-->");
							Btn($$renderer, {
								variant: "rojo",
								class: "!min-h-[48px] !text-base",
								onclick: () => vengoYo(n),
								children: ($$renderer) => {
									$$renderer.push(`<!---->🙋 Voy yo`);
								},
								$$slots: { default: true }
							});
						} else {
							$$renderer.push(`<!--[-1--><div class="text-sm font-extrabold text-petroleo">🙋 ${escape_html(helper?.id === app.user.id ? "Tú vas" : `${nombreVisible(helper)} va`)} en camino</div> `);
							if (helper?.id === app.user.id && n.contactPhone) $$renderer.push(`<!--[0--><a${attr("href", `tel:+${stringify(n.contactPhone)}`)} class="flex min-h-[48px] items-center justify-center rounded-2xl border-2 border-linea bg-white font-black">📞 Llamar</a>`);
							else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]-->`);
						}
						$$renderer.push(`<!--]--></div>`);
					}
					$$renderer.push(`<!--]-->`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]-->`);
			},
			$$slots: { default: true }
		});
		$$renderer.push(`<!----></div>`);
	});
}
// src/lib/pantallas/ApiDocs.svelte
function ApiDocs($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		Screen($$renderer, {
			children: ($$renderer) => {
				Header($$renderer, { title: "API Docs" });
				$$renderer.push(`<!----> <div id="swagger-ui"></div>`);
			},
			$$slots: { default: true }
		});
	});
}
// src/lib/pantallas/PendientesSync.svelte
function PendientesSync($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const rechazadas = derived(() => datos.outbox.filter((o) => o.usuarioId === app.user?.id && o.estado === "rechazada"));
		const btn = "min-h-[44px] flex-1 rounded-xl border-2 border-linea bg-white px-2 text-xs font-extrabold";
		Screen($$renderer, {
			class: "gap-3",
			children: ($$renderer) => {
				Header($$renderer, { title: "Envíos" });
				$$renderer.push(`<!----> `);
				H1($$renderer, {
					children: ($$renderer) => {
						$$renderer.push(`<!---->Cambios que no se pudieron enviar`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----> `);
				Sub($$renderer, {
					children: ($$renderer) => {
						$$renderer.push(`<!---->El servidor no los aceptó. Puedes intentarlo de nuevo o descartarlos.`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----> `);
				const each_array = ensure_array_like(rechazadas());
				if (each_array.length !== 0) {
					$$renderer.push("<!--[-->");
					for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
						let o = each_array[$$index];
						$$renderer.push(`<div class="flex flex-col gap-2 rounded-[20px] border-2 border-rojo bg-white p-4"><div class="font-black">${escape_html(o.descripcion || o.entidad)}</div> <div class="text-sm font-semibold text-rojo-osc">${escape_html(o.error?.mensaje ?? "Rechazado por el servidor")}</div> <div class="flex gap-2"><button type="button"${attr_class(clsx(btn))}>🔁 Reintentar</button> <button type="button"${attr_class(clsx(btn))}>🗑️ Descartar</button></div></div>`);
					}
				} else {
					$$renderer.push("<!--[!-->");
					EmptyState($$renderer, {
						emoji: "✅",
						title: "Todo enviado"
					});
				}
				$$renderer.push(`<!--]-->`);
			},
			$$slots: { default: true }
		});
	});
}
// src/lib/pantallas/perfil/Perfil.svelte
function Perfil($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const user = derived(() => app.user);
		const balance = derived(() => balanceAyni(user().id, datos.favors));
		const publicaciones = derived(() => datos.favors.filter((f) => f.ownerId === user().id && f.status !== "cerrado").length + datos.services.filter((s) => s.ownerId === user().id).length);
		const progreso = derived(() => progresoGuardian(user()));
		const dias = derived(() => diasEnAyni(user()));
		const fila = "flex min-h-[56px] w-full items-center gap-3 border-b border-linea px-4 text-left last:border-b-0";
		async function verComoGuardian(on) {
			if (await demoGuardian(on)) app.notify(on ? "🛡️ Ahora ves AYNI como Guardián" : "Volviste a ser vecino(a)");
		}
		$$renderer.push(`<div class="flex flex-1 flex-col"><div class="relative flex flex-col items-center gap-2 rounded-b-[28px] bg-petroleo px-5 pb-6 pt-4 text-center text-white">`);
		LangChip($$renderer, { class: "absolute right-4 top-3" });
		$$renderer.push(`<!----> `);
		Avatar($$renderer, {
			letter: inicial(user()),
			class: "h-20 w-20 border-[3px] border-white bg-ambar text-3xl"
		});
		$$renderer.push(`<!----> <h1 class="text-2xl font-black">${escape_html(user().firstName)} ${escape_html(user().lastName)}</h1> <p class="text-sm font-semibold opacity-90">Tus vecinos te ven como “${escape_html(nombreVisible(user()))}” · ${escape_html(app.sector?.name)} · Mz. ${escape_html(user().manzana)}</p> <div class="flex flex-wrap justify-center gap-2">`);
		Chip($$renderer, {
			class: "bg-white text-petroleo-osc",
			children: ($$renderer) => {
				$$renderer.push(`<!---->✅ Vecino(a) verificado(a)`);
			},
			$$slots: { default: true }
		});
		$$renderer.push(`<!----> `);
		if (app.isGuardian) {
			$$renderer.push("<!--[0-->");
			Chip($$renderer, {
				class: "bg-morado text-white",
				children: ($$renderer) => {
					$$renderer.push(`<!---->🛡️ Guardián`);
				},
				$$slots: { default: true }
			});
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div></div> `);
		Screen($$renderer, {
			class: "gap-3",
			children: ($$renderer) => {
				$$renderer.push(`<div class="rounded-[20px] border-2 border-morado bg-white p-4"><div class="text-base font-black text-morado-osc">🤝 Tu Balance de Ayni</div> <div class="mt-2 grid grid-cols-2 gap-2.5 text-center"><div class="rounded-2xl bg-morado-claro p-2 text-morado-osc"><div class="text-2xl font-black">${escape_html(balance().dados)}</div><div class="text-xs font-extrabold">favores dados</div></div> <div class="rounded-2xl bg-morado-claro p-2 text-morado-osc"><div class="text-2xl font-black">${escape_html(balance().recibidos)}</div><div class="text-xs font-extrabold">favores recibidos</div></div></div></div> `);
				if (!app.isGuardian) {
					$$renderer.push(`<!--[0--><div class="flex flex-col gap-2 rounded-[20px] border border-linea bg-white p-4"><div class="flex justify-between text-base font-black"><span>🛡️ Camino a Guardián</span> <span class="text-sm text-gris">${escape_html(Math.round(progreso() * 100))}%</span></div> <div class="h-2 overflow-hidden rounded-full bg-linea"><div class="h-full rounded-full bg-morado"${attr_style(`width: ${stringify(progreso() * 100)}%`)}></div></div> <div class="text-sm font-semibold text-gris">${escape_html(dias() >= 60 ? "Ya cumples los 2 meses. ¡Puedes ser Guardián!" : `Llevas ${dias()} días en AYNI. Te invitaremos al cumplir 2 meses.`)}</div> `);
					if (dias() >= 60) {
						$$renderer.push("<!--[0-->");
						Btn($$renderer, {
							variant: "acento",
							onclick: () => app.go("invitacionGuardian"),
							children: ($$renderer) => {
								$$renderer.push(`<!---->Quiero ser Guardián`);
							},
							$$slots: { default: true }
						});
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--></div>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> <div class="grid grid-cols-2 gap-2.5 text-center"><div class="rounded-2xl border border-linea bg-white p-2"><div class="text-xl font-black">${escape_html(publicaciones())}</div><div class="text-xs font-bold text-gris">publicaciones</div></div> <div class="rounded-2xl border border-linea bg-white p-2"><div class="text-xl font-black">${escape_html(datos.recommendations.filter((r) => r.userId === user().id).length)}</div><div class="text-xs font-bold text-gris">vistos buenos dados</div></div></div> <nav class="overflow-hidden rounded-[20px] border border-linea bg-white" aria-label="Menú"><button type="button"${attr_class(clsx(fila))}>`);
				Icon($$renderer, { name: "fa-clipboard-list" });
				$$renderer.push(`<!----> <span class="flex-1 font-bold">Mis publicaciones</span>›</button> `);
				if (app.isGuardian) {
					$$renderer.push(`<!--[0--><button type="button"${attr_class(clsx(fila))}>`);
					Icon($$renderer, { name: "fa-shield-halved" });
					$$renderer.push(`<!----> <span class="flex-1 font-bold">Panel del Guardián</span>›</button>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> <button type="button"${attr_class(clsx(fila))}><span aria-hidden="true">⚙️</span><span class="flex-1 font-bold">Idioma, letra grande y zona</span>›</button> <button type="button"${attr_class(clsx(fila))}><span aria-hidden="true">📖</span><span class="flex-1 font-bold">Ver tutorial otra vez</span>›</button> <button type="button"${attr_class(clsx(fila))}><span aria-hidden="true">🚪</span><span class="flex-1 font-bold text-gris">Cerrar sesión</span>›</button></nav> `);
				if (app.servidor.demo) {
					$$renderer.push(`<!--[0--><details class="rounded-[20px] border border-dashed border-gris bg-white p-4"><summary class="min-h-[32px] cursor-pointer text-sm font-extrabold text-gris">🧪 Herramientas de demostración (para el jurado)</summary> <div class="mt-2 flex flex-col">`);
					Toggle($$renderer, {
						checked: app.settings.forceOffline,
						onChange: (v) => app.setSettings((s) => ({
							...s,
							forceOffline: v
						})),
						label: "Simular sin conexión",
						hint: "Lo que publiques quedará “pendiente de enviar”"
					});
					$$renderer.push(`<!----> `);
					Toggle($$renderer, {
						checked: app.isGuardian,
						onChange: verComoGuardian,
						label: "Ver AYNI como Guardián",
						hint: "Para confirmar emergencias y moderar desde este celular"
					});
					$$renderer.push(`<!----> <button type="button" class="min-h-[52px] text-left text-base font-bold">⏩ Simular 2 meses en AYNI</button> <button type="button" class="min-h-[52px] text-left text-base font-bold text-gris">♻️ Reiniciar datos de demostración</button></div></details>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]-->`);
			},
			$$slots: { default: true }
		});
		$$renderer.push(`<!----></div>`);
	});
}
// src/lib/pantallas/perfil/Ajustes.svelte
function Ajustes($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		function cambiar(patch) {
			app.setSettings((s) => ({
				...s,
				...patch
			}));
			if (app.user) actualizarPerfil({
				..."lang" in patch ? { lang: patch.lang } : {},
				..."largeText" in patch ? { largeText: patch.largeText } : {}
			});
		}
		Screen($$renderer, {
			children: ($$renderer) => {
				Header($$renderer, { title: "Ajustes" });
				$$renderer.push(`<!----> `);
				H1($$renderer, {
					children: ($$renderer) => {
						$$renderer.push(`<!---->Idioma y lectura`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----> <div class="text-sm font-extrabold text-gris">Idioma</div> <div class="overflow-hidden rounded-[20px] border border-linea bg-white" role="radiogroup"><!--[-->`);
				const each_array = ensure_array_like(IDIOMAS);
				for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
					let l = each_array[$$index];
					$$renderer.push(`<button type="button" role="radio"${attr("aria-checked", app.settings.lang === l.id)} class="flex min-h-[56px] w-full items-center border-b border-linea px-4 text-left text-base font-bold last:border-b-0"><span class="flex-1">${escape_html(l.label)}</span> <span${attr_class(`h-[22px] w-[22px] rounded-full ${app.settings.lang === l.id ? "border-[6px] border-morado" : "border-2 border-linea"}`)}></span></button>`);
				}
				$$renderer.push(`<!--]--></div> `);
				if (app.settings.lang === "qu") $$renderer.push(`<!--[0--><p class="text-xs font-semibold text-gris">Traducción al runasimi en preparación: por ahora se muestran algunos textos.</p>`);
				else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> <div class="text-sm font-extrabold text-gris">Lectura</div> <div class="rounded-[20px] border border-linea bg-white px-4">`);
				Toggle($$renderer, {
					checked: app.settings.largeText,
					onChange: (v) => cambiar({ largeText: v }),
					label: "🔠 Letra grande",
					hint: "Agranda los textos de toda la app"
				});
				$$renderer.push(`<!----></div> `);
				if (app.user && app.sector) {
					$$renderer.push(`<!--[0--><div class="text-sm font-extrabold text-gris">Mi zona · ${escape_html(app.sector.name)}</div> `);
					Pills($$renderer, {
						options: app.sector.manzanas.map((m) => ({
							id: m,
							label: `Mz. ${m}`
						})),
						value: app.user.manzana,
						onChange: (m) => actualizarPerfil({ manzana: m })
					});
					$$renderer.push(`<!---->`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> <div class="flex-1"></div> `);
				Btn($$renderer, {
					variant: "borde",
					onclick: () => app.go("apiDocs"),
					children: ($$renderer) => {
						$$renderer.push(`<!---->🛠️ Docs API (dev)`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----> `);
				Btn($$renderer, {
					onclick: app.back,
					children: ($$renderer) => {
						$$renderer.push(`<!---->Listo`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!---->`);
			},
			$$slots: { default: true }
		});
	});
}
// src/lib/pantallas/perfil/PanelGuardian.svelte
function PanelGuardian($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		/** El panel permite descartar sin escribir motivo; la base exige uno (mismo texto que usa el servidor). */
		const MOTIVO_POR_DEFECTO = "Un Guardián revisó el reporte y no activó la emergencia.";
		let descartando = null;
		let motivo = "";
		const pendientes = derived(() => datos.emergencies.filter((e) => e.sectorId === app.user.sectorId && e.status === "pendiente"));
		const activa = derived(() => datos.emergencies.find((e) => e.sectorId === app.user.sectorId && e.status === "activa"));
		const pedidos = derived(() => activa() ? datos.needs.filter((n) => n.emergencyId === activa().id) : []);
		const sinAtender = derived(() => pedidos().filter((n) => n.status === "abierto").length);
		const ayudantes = derived(() => new Set(pedidos().map((n) => n.helperId).filter(Boolean)).size);
		const aSalvo = derived(() => activa() ? activa().resumen?.a_salvo ?? Object.values(activa().acks ?? {}).filter((a) => a === "bien").length : 0);
		function confirmar(e) {
			confirmarEmergencia(e);
			app.notify("🚨 Modo emergencia activado. Tus vecinos fueron avisados.");
		}
		function descartar(e) {
			descartarEmergencia(e, motivo.trim() || MOTIVO_POR_DEFECTO);
			descartando = null;
			motivo = "";
			app.notify("Reporte descartado. Avisamos al vecino.");
		}
		function cerrar(e) {
			cerrarEmergencia(e);
			app.notify("🕊️ Emergencia marcada como atendida");
		}
		function decidir(g, aprobar) {
			moderar(g, aprobar);
			app.notify(aprobar ? "Publicación aprobada y visible otra vez" : "Publicación ocultada");
		}
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (!app.isGuardian) {
				$$renderer.push("<!--[0-->");
				Screen($$renderer, {
					children: ($$renderer) => {
						Header($$renderer, {});
						$$renderer.push(`<!----> `);
						EmptyState($$renderer, {
							emoji: "🛡️",
							title: "Solo para Guardianes"
						});
						$$renderer.push(`<!---->`);
					},
					$$slots: { default: true }
				});
			} else {
				$$renderer.push("<!--[-1-->");
				Screen($$renderer, {
					class: "gap-3",
					children: ($$renderer) => {
						Header($$renderer, { title: "Mi perfil" });
						$$renderer.push(`<!----> <div class="flex items-center gap-3 rounded-[20px] border-2 border-morado bg-morado-claro p-3.5"><span class="text-3xl" aria-hidden="true">🛡️</span> <div><div class="font-black">Panel del Guardián</div> <div class="text-sm font-semibold text-gris">${escape_html(app.sector?.name)}</div></div></div> <h2 class="text-lg font-black">Emergencias por confirmar</h2> `);
						if (pendientes().length === 0) $$renderer.push(`<!--[0--><div class="rounded-2xl border border-linea bg-white p-4 font-semibold text-gris">🙌 No hay reportes pendientes</div>`);
						else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]--> <!--[-->`);
						const each_array = ensure_array_like(pendientes());
						for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
							let e = each_array[$$index];
							const tipo = emergenciaById(e.tipo);
							const autor = app.users.find((u) => u.id === e.reporterId);
							$$renderer.push(`<div class="flex flex-col gap-2.5 rounded-3xl border-2 border-rojo bg-white p-4"><div class="flex items-center justify-between">`);
							Chip($$renderer, {
								class: "bg-rojo-claro text-rojo-osc",
								children: ($$renderer) => {
									$$renderer.push(`<!---->${escape_html(tipo.emoji)} ${escape_html(tipo.label.toUpperCase())}`);
								},
								$$slots: { default: true }
							});
							$$renderer.push(`<!----> <span class="text-xs font-semibold text-gris">${escape_html(hace(e.createdAt))}</span></div> `);
							if (e.texto) $$renderer.push(`<!--[0--><p class="text-lg font-extrabold">“${escape_html(e.texto)}”</p>`);
							else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]--> `);
							if (e.foto) $$renderer.push(`<!--[0--><img${attr("src", e.foto)} alt="Foto del reporte" class="max-h-48 rounded-2xl object-cover"/>`);
							else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]--> <div class="text-sm font-semibold text-gris">Reportado por ${escape_html(autor?.id === app.user.id ? "ti" : nombreVisible(autor))} · Mz. ${escape_html(e.manzana)}</div> `);
							if (descartando === e.id) {
								$$renderer.push("<!--[0-->");
								TextArea($$renderer, {
									placeholder: "Motivo (opcional). Ej: Los bomberos ya controlaron la acequia.",
									get value() {
										return motivo;
									},
									set value($$value) {
										motivo = $$value;
										$$settled = false;
									}
								});
								$$renderer.push(`<!----> `);
								Btn($$renderer, {
									variant: "borde",
									onclick: () => descartar(e),
									children: ($$renderer) => {
										$$renderer.push(`<!---->Descartar reporte`);
									},
									$$slots: { default: true }
								});
								$$renderer.push(`<!----> <button type="button" class="min-h-[44px] text-sm font-bold text-gris">Cancelar</button>`);
							} else {
								$$renderer.push(`<!--[-1--><p class="text-sm font-semibold">Si confirmas, se activará el modo emergencia para todo ${escape_html(app.sector?.name)}.</p> `);
								Btn($$renderer, {
									variant: "rojo",
									onclick: () => confirmar(e),
									children: ($$renderer) => {
										$$renderer.push(`<!---->✓ Confirmar emergencia`);
									},
									$$slots: { default: true }
								});
								$$renderer.push(`<!----> `);
								Btn($$renderer, {
									variant: "borde",
									onclick: () => descartando = e.id,
									children: ($$renderer) => {
										$$renderer.push(`<!---->Descartar`);
									},
									$$slots: { default: true }
								});
								$$renderer.push(`<!---->`);
							}
							$$renderer.push(`<!--]--></div>`);
						}
						$$renderer.push(`<!--]--> `);
						if (activa()) {
							$$renderer.push(`<!--[0--><h2 class="text-lg font-black text-rojo-osc">🚨 Emergencia activa · ${escape_html(emergenciaById(activa().tipo).label)}</h2> <div class="grid grid-cols-3 gap-2 text-center"><!--[-->`);
							const each_array_1 = ensure_array_like([
								[pedidos().length, "pedidos de ayuda"],
								[pedidos().length - sinAtender(), "atendidos"],
								[ayudantes() + aSalvo(), "vecinos a salvo o ayudando"]
							]);
							for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
								let [n, l] = each_array_1[$$index_1];
								$$renderer.push(`<div class="rounded-2xl border border-linea bg-white p-2"><div class="text-2xl font-black">${escape_html(n)}</div> <div class="text-[11px] font-bold leading-tight text-gris">${escape_html(l)}</div></div>`);
							}
							$$renderer.push(`<!--]--></div> `);
							if (sinAtender() > 0) $$renderer.push(`<!--[0--><div class="rounded-2xl border border-ambar bg-ambar-claro p-3 text-sm font-bold">⚠️ Aún hay ${escape_html(sinAtender())} pedido(s) sin atender. Revisa el mapa antes de cerrar.</div>`);
							else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]--> `);
							Btn($$renderer, {
								onclick: () => cerrar(activa()),
								children: ($$renderer) => {
									$$renderer.push(`<!---->✓ Marcar emergencia como atendida`);
								},
								$$slots: { default: true }
							});
							$$renderer.push(`<!----> `);
							Btn($$renderer, {
								variant: "borde",
								onclick: () => app.go("mapa"),
								children: ($$renderer) => {
									$$renderer.push(`<!---->Ver mapa de ayuda`);
								},
								$$slots: { default: true }
							});
							$$renderer.push(`<!---->`);
						} else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]--> <h2 class="text-lg font-black">Publicaciones reportadas (${escape_html(datos.moderation.length)})</h2> `);
						if (datos.moderation.length === 0) $$renderer.push(`<!--[0--><div class="rounded-2xl border border-linea bg-white p-4 font-semibold text-gris">Todo en orden 👌</div>`);
						else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]--> <!--[-->`);
						const each_array_2 = ensure_array_like(datos.moderation);
						for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
							let g = each_array_2[$$index_2];
							$$renderer.push(`<div class="flex flex-col gap-2 rounded-[20px] border-2 border-ambar bg-white p-4"><div class="flex items-center justify-between gap-2">`);
							Chip($$renderer, {
								class: "bg-ambar-claro text-tinta",
								children: ($$renderer) => {
									$$renderer.push(`<!---->${escape_html(g.hidden ? "Oculta automáticamente" : "En revisión")}`);
								},
								$$slots: { default: true }
							});
							$$renderer.push(`<!----> <span class="text-xs font-bold text-gris">${escape_html(g.total)} reporte(s)</span></div> <p class="font-bold">“${escape_html(g.descripcion ?? g.titulo)}”</p> <p class="text-sm font-semibold text-gris">Motivo más común: ${escape_html(g.motivoPrincipal)}</p> <div class="flex gap-2">`);
							Btn($$renderer, {
								variant: "borde",
								class: "!min-h-[48px] !text-base",
								onclick: () => decidir(g, true),
								children: ($$renderer) => {
									$$renderer.push(`<!---->Aprobar`);
								},
								$$slots: { default: true }
							});
							$$renderer.push(`<!----> `);
							Btn($$renderer, {
								class: "!min-h-[48px] !text-base",
								onclick: () => decidir(g, false),
								children: ($$renderer) => {
									$$renderer.push(`<!---->Ocultar`);
								},
								$$slots: { default: true }
							});
							$$renderer.push(`<!----></div></div>`);
						}
						$$renderer.push(`<!--]-->`);
					},
					$$slots: { default: true }
				});
			}
			$$renderer.push(`<!--]-->`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
	});
}
// src/lib/pantallas/perfil/InvitacionSheet.svelte
function InvitacionSheet($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { onClose } = $$props;
		function responder(acepta) {
			responderInvitacion(acepta);
			if (acepta) app.go("guardianAceptado");
			else onClose?.();
		}
		Sheet($$renderer, {
			onClose: () => responder(false),
			children: ($$renderer) => {
				Circle($$renderer, {
					emoji: "🛡️",
					class: "h-24 w-24 bg-morado"
				});
				$$renderer.push(`<!----> <h2 class="text-center text-xl font-black">¡Llevas 2 meses ayudando en AYNI!</h2> <p class="text-center font-semibold text-gris">Tus vecinos confían en ti. ¿Quieres ser Guardián de ${escape_html(app.sector?.name)}?</p> <ul class="flex flex-col gap-1.5 rounded-2xl bg-morado-claro p-4 text-sm font-extrabold text-morado-osc"><li>✅ Confirmar o descartar emergencias</li> <li>✅ Avisar cuando la emergencia fue atendida</li> <li>✅ Revisar publicaciones reportadas</li></ul> `);
				Btn($$renderer, {
					variant: "acento",
					onclick: () => responder(true),
					children: ($$renderer) => {
						$$renderer.push(`<!---->Acepto ser Guardián`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----> `);
				Btn($$renderer, {
					variant: "borde",
					onclick: () => responder(false),
					children: ($$renderer) => {
						$$renderer.push(`<!---->Ahora no`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!---->`);
			},
			$$slots: { default: true }
		});
	});
}
// src/lib/pantallas/perfil/InvitacionGuardian.svelte
function InvitacionGuardian($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		Screen($$renderer, {
			children: ($$renderer) => {
				Header($$renderer, {});
				$$renderer.push(`<!----> `);
				InvitacionSheet($$renderer, { onClose: app.back });
				$$renderer.push(`<!---->`);
			},
			$$slots: { default: true }
		});
	});
}
// src/lib/pantallas/perfil/GuardianAceptado.svelte
function GuardianAceptado($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		Screen($$renderer, {
			class: "text-center",
			children: ($$renderer) => {
				$$renderer.push(`<div class="flex-1"></div> `);
				Circle($$renderer, {
					emoji: "🛡️",
					class: "bg-morado"
				});
				$$renderer.push(`<!----> <div>`);
				Chip($$renderer, {
					class: "bg-morado-claro text-sm text-morado-osc",
					children: ($$renderer) => {
						$$renderer.push(`<!---->Guardián de ${escape_html(app.sector?.name)}`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----></div> `);
				H1($$renderer, {
					children: ($$renderer) => {
						$$renderer.push(`<!---->¡Ya eres Guardián!`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----> `);
				Sub($$renderer, {
					children: ($$renderer) => {
						$$renderer.push(`<!---->Te avisaremos cuando un vecino reporte una emergencia o una publicación necesite revisión.`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----> <div class="flex-1"></div> `);
				Btn($$renderer, {
					variant: "acento",
					onclick: () => {
						app.reset("perfil");
						app.go("panelGuardian");
					},
					children: ($$renderer) => {
						$$renderer.push(`<!---->Ir a mi panel`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----> `);
				Btn($$renderer, {
					variant: "borde",
					onclick: () => app.reset("inicio"),
					children: ($$renderer) => {
						$$renderer.push(`<!---->Volver al inicio`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!---->`);
			},
			$$slots: { default: true }
		});
	});
}
// src/lib/pantallas/perfil/Reportar.svelte
function Reportar($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { col, id } = $$props;
		let motivo = MOTIVOS_REPORTE[0];
		const yaReporto = derived(() => datos.reports.some((r) => r.col === col && r.targetId === id && r.userId === app.user.id));
		function enviar() {
			reportar(col, id, motivo);
			app.notify("Gracias. Un Guardián lo revisará.");
			app.back();
		}
		Screen($$renderer, {
			children: ($$renderer) => {
				Header($$renderer, { title: "Reportar" });
				$$renderer.push(`<!----> `);
				H1($$renderer, {
					children: ($$renderer) => {
						$$renderer.push(`<!---->¿Por qué reportas esta publicación?`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----> `);
				if (yaReporto()) {
					$$renderer.push("<!--[0-->");
					EmptyState($$renderer, {
						emoji: "✅",
						title: "Ya enviaste un reporte",
						children: ($$renderer) => {
							$$renderer.push(`<!---->Un Guardián lo está revisando.`);
						},
						$$slots: { default: true }
					});
				} else {
					$$renderer.push(`<!--[-1--><div class="flex flex-col gap-2" role="radiogroup"><!--[-->`);
					const each_array = ensure_array_like(MOTIVOS_REPORTE);
					for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
						let m = each_array[$$index];
						$$renderer.push(`<button type="button" role="radio"${attr("aria-checked", motivo === m)}${attr_class(`flex min-h-[56px] items-center justify-between rounded-2xl border-2 px-4 text-left font-bold ${motivo === m ? "border-petroleo bg-petroleo-claro" : "border-linea bg-white"}`)}>${escape_html(m)} `);
						if (motivo === m) $$renderer.push(`<!--[0--><span aria-hidden="true">✓</span>`);
						else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]--></button>`);
					}
					$$renderer.push(`<!--]--></div> `);
					Sub($$renderer, {
						class: "text-sm",
						children: ($$renderer) => {
							$$renderer.push(`<!---->Un Guardián lo revisará. Tu nombre no se muestra a quien publicó. Con ${escape_html(3)} reportes, la publicación se oculta mientras se revisa.`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> <div class="flex-1"></div> `);
					Btn($$renderer, {
						onclick: enviar,
						children: ($$renderer) => {
							$$renderer.push(`<!---->Enviar reporte`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!---->`);
				}
				$$renderer.push(`<!--]-->`);
			},
			$$slots: { default: true }
		});
	});
}
// src/lib/ui/OptionGrid.svelte
function OptionGrid($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const TONO = {
			morado: "border-morado bg-morado-claro text-morado-osc",
			rojo: "border-rojo bg-rojo-claro text-rojo-osc",
			petroleo: "border-petroleo bg-petroleo-claro text-petroleo-osc"
		};
		const COLS = {
			2: "grid-cols-2",
			3: "grid-cols-3",
			4: "grid-cols-4"
		};
		let { options, value, onChange, multi = false, cols = 3, tone = "morado" } = $$props;
		const isOn = (id) => multi ? value.includes(id) : value === id;
		$$renderer.push(`<div${attr_class(`grid gap-2.5 ${stringify(COLS[cols])}`)}><!--[-->`);
		const each_array = ensure_array_like(options);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let o = each_array[$$index];
			$$renderer.push(`<button type="button"${attr("aria-pressed", isOn(o.id))}${attr_class(`flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-2xl border-2 px-1 text-center text-xs font-extrabold leading-tight ${stringify(isOn(o.id) ? TONO[tone] : "border-linea bg-white text-tinta")}`)}><span class="text-2xl" aria-hidden="true">${escape_html(o.emoji)}</span> ${escape_html(o.label)}</button>`);
		}
		$$renderer.push(`<!--]--></div>`);
	});
}
// src/lib/pantallas/emergencia/ReportarEmergencia.svelte
function ReportarEmergencia($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let tipo = "";
		let texto = "";
		let foto = null;
		function enviar() {
			const e = reportarEmergencia({
				tipo,
				texto: texto.trim(),
				foto
			});
			app.replace("reporteEnviado", { id: e.id });
		}
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			Screen($$renderer, {
				class: "gap-3",
				children: ($$renderer) => {
					Header($$renderer, { title: "Lo verá un Guardián" });
					$$renderer.push(`<!----> `);
					H1($$renderer, {
						children: ($$renderer) => {
							$$renderer.push(`<!---->¿Qué está pasando?`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					OptionGrid($$renderer, {
						options: TIPOS_EMERGENCIA,
						value: tipo,
						onChange: (v) => tipo = v,
						tone: "rojo"
					});
					$$renderer.push(`<!----> `);
					Field($$renderer, {
						label: "Cuéntanos más (opcional)",
						children: ($$renderer) => {
							TextArea($$renderer, {
								maxlength: 200,
								placeholder: "Ej: Se desbordó la acequia y el agua entra a las casas…",
								get value() {
									return texto;
								},
								set value($$value) {
									texto = $$value;
									$$settled = false;
								}
							});
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					PhotoPicker($$renderer, {
						value: foto,
						onChange: (v) => foto = v
					});
					$$renderer.push(`<!----> <div class="text-sm font-semibold text-gris">📍 Ubicación automática: Mz. ${escape_html(app.user.manzana)}</div> `);
					if (app.isGuardian) $$renderer.push(`<!--[0--><div class="rounded-2xl bg-morado-claro p-3 text-sm font-bold text-morado-osc">🛡️ Como Guardián podrás confirmarlo tú mismo desde tu panel.</div>`);
					else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> <div class="flex-1"></div> `);
					Btn($$renderer, {
						variant: "rojo",
						disabled: !tipo,
						onclick: enviar,
						children: ($$renderer) => {
							$$renderer.push(`<!---->Enviar reporte`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!---->`);
				},
				$$slots: { default: true }
			});
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
	});
}
// src/lib/ui/Steps.svelte
function Steps($$renderer, $$props) {
	let { items } = $$props;
	$$renderer.push(`<ol class="flex flex-col gap-3 rounded-[20px] border border-linea bg-white p-4"><!--[-->`);
	const each_array = ensure_array_like(items);
	for (let i = 0, $$length = each_array.length; i < $$length; i++) {
		let [icono, titulo, detalle, activo] = each_array[i];
		$$renderer.push(`<li class="flex items-center gap-3"><span class="text-xl" aria-hidden="true">${escape_html(icono)}</span> <span class="flex-1"><span${attr_class(`block text-[15px] font-black ${activo ? "text-tinta" : "text-gris"}`)}>${escape_html(titulo)}</span> `);
		if (detalle) $$renderer.push(`<!--[0--><span class="block text-xs font-semibold text-gris">${escape_html(detalle)}</span>`);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></span></li>`);
	}
	$$renderer.push(`<!--]--></ol>`);
}
// src/lib/pantallas/emergencia/ReporteEnviado.svelte
function ReporteEnviado($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { id } = $$props;
		const e = derived(() => datos.emergencies.find((x) => x.id === id));
		Screen($$renderer, {
			class: "text-center",
			children: ($$renderer) => {
				$$renderer.push(`<div class="flex-1"></div> `);
				Circle($$renderer, {
					emoji: "⏳",
					class: "bg-ambar-claro"
				});
				$$renderer.push(`<!----> `);
				H1($$renderer, {
					children: ($$renderer) => {
						$$renderer.push(`<!---->Reporte enviado`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----> `);
				Sub($$renderer, {
					children: ($$renderer) => {
						$$renderer.push(`<!---->Un Guardián de tu sector lo revisará en breve. Te avisaremos apenas responda.`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----> <div class="text-left">`);
				Steps($$renderer, { items: [
					[
						"✅",
						"Enviado",
						e() && hora(e().createdAt),
						true
					],
					[
						e()?.status === "pendiente" ? "⏳" : "✅",
						"Revisión del Guardián",
						e()?.status === "pendiente" ? "En curso" : "Listo",
						true
					],
					[
						e()?.status === "activa" ? "✅" : "⚪",
						"Aviso a tus vecinos",
						"",
						e()?.status === "activa"
					]
				] });
				$$renderer.push(`<!----></div> <p class="text-left text-sm font-extrabold text-rojo-osc">¿Hay peligro inmediato? Llama ya:</p> `);
				NumerosEmergencia($$renderer, {});
				$$renderer.push(`<!----> <div class="flex-1"></div> `);
				if (app.isGuardian) {
					$$renderer.push("<!--[0-->");
					Btn($$renderer, {
						variant: "acento",
						onclick: () => app.go("panelGuardian"),
						children: ($$renderer) => {
							$$renderer.push(`<!---->🛡️ Revisarlo en mi panel`);
						},
						$$slots: { default: true }
					});
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> `);
				Btn($$renderer, {
					variant: "borde",
					onclick: () => app.reset("inicio"),
					children: ($$renderer) => {
						$$renderer.push(`<!---->Volver al inicio`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!---->`);
			},
			$$slots: { default: true }
		});
	});
}
// src/lib/ui/FullOverlay.svelte
function FullOverlay($$renderer, $$props) {
	let { class: clase = "bg-crema", children } = $$props;
	$$renderer.push(`<div class="fixed inset-0 z-50 flex justify-center bg-petroleo-osc/40"><div role="alertdialog" aria-modal="true"${attr_class(`flex w-full max-w-[430px] flex-col overflow-y-auto ${stringify(clase)}`)}>`);
	children?.($$renderer);
	$$renderer.push(`<!----></div></div>`);
}
// src/lib/pantallas/emergencia/ResultadoReporte.svelte
function ResultadoReporte($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { e } = $$props;
		const guardian = derived(() => app.users.find((u) => u.id === (e.confirmedBy ?? e.reviewedBy)));
		const vecinos = derived(() => app.sector?.totalVecinos || app.users.filter((u) => u.sectorId === e.sectorId).length);
		function cerrar(destino) {
			acusarEmergencia(e, {
				reporteroVisto: true,
				respuesta: e.status === "activa" ? "visto" : void 0
			});
			app.reset(destino);
		}
		if (e.status === "activa") {
			$$renderer.push("<!--[0-->");
			FullOverlay($$renderer, {
				children: ($$renderer) => {
					Screen($$renderer, {
						class: "text-center",
						children: ($$renderer) => {
							$$renderer.push(`<div class="flex-1"></div> `);
							Circle($$renderer, {
								emoji: "✅",
								class: "bg-rojo-claro"
							});
							$$renderer.push(`<!----> `);
							H1($$renderer, {
								children: ($$renderer) => {
									$$renderer.push(`<!---->Tu reporte fue confirmado`);
								},
								$$slots: { default: true }
							});
							$$renderer.push(`<!----> `);
							Sub($$renderer, {
								children: ($$renderer) => {
									$$renderer.push(`<!---->Un Guardián activó el modo emergencia en tu sector. Tus vecinos ya fueron avisados. ¡Gracias por avisar!`);
								},
								$$slots: { default: true }
							});
							$$renderer.push(`<!----> <div class="text-left">`);
							Steps($$renderer, { items: [
								[
									"✅",
									"Enviado",
									hora(e.createdAt),
									true
								],
								[
									"✅",
									`Confirmado por ${nombreVisible(guardian())} (Guardián)`,
									hora(e.confirmedAt),
									true
								],
								[
									"✅",
									"Vecinos avisados",
									`${vecinos()} vecinos`,
									true
								]
							] });
							$$renderer.push(`<!----></div> <div class="flex-1"></div> `);
							Btn($$renderer, {
								variant: "rojo",
								onclick: () => cerrar("inicio"),
								children: ($$renderer) => {
									$$renderer.push(`<!---->Ver la emergencia`);
								},
								$$slots: { default: true }
							});
							$$renderer.push(`<!---->`);
						},
						$$slots: { default: true }
					});
				},
				$$slots: { default: true }
			});
		} else {
			$$renderer.push("<!--[-1-->");
			FullOverlay($$renderer, {
				children: ($$renderer) => {
					Screen($$renderer, {
						class: "text-center",
						children: ($$renderer) => {
							$$renderer.push(`<div class="flex-1"></div> `);
							Circle($$renderer, {
								emoji: "ℹ️",
								class: "bg-ambar-claro"
							});
							$$renderer.push(`<!----> `);
							H1($$renderer, {
								children: ($$renderer) => {
									$$renderer.push(`<!---->No se activó la emergencia`);
								},
								$$slots: { default: true }
							});
							$$renderer.push(`<!----> `);
							Sub($$renderer, {
								children: ($$renderer) => {
									$$renderer.push(`<!---->Un Guardián revisó tu reporte. Gracias por estar atento a tu sector.`);
								},
								$$slots: { default: true }
							});
							$$renderer.push(`<!----> `);
							if (e.motivo) $$renderer.push(`<!--[0--><div class="rounded-[20px] border border-linea bg-white p-4 text-left"><div class="text-sm font-extrabold text-gris">Motivo del Guardián</div> <p class="font-semibold">“${escape_html(e.motivo)}”</p></div>`);
							else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]--> <p class="text-left text-sm font-extrabold text-rojo-osc">Si crees que es grave, llama directamente:</p> `);
							NumerosEmergencia($$renderer, {});
							$$renderer.push(`<!----> <div class="flex-1"></div> `);
							Btn($$renderer, {
								onclick: () => cerrar("inicio"),
								children: ($$renderer) => {
									$$renderer.push(`<!---->Entendido`);
								},
								$$slots: { default: true }
							});
							$$renderer.push(`<!---->`);
						},
						$$slots: { default: true }
					});
				},
				$$slots: { default: true }
			});
		}
		$$renderer.push(`<!--]-->`);
	});
}
// src/lib/pantallas/emergencia/AlertaEmergencia.svelte
function AlertaEmergencia($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { e } = $$props;
		const tipo = derived(() => emergenciaById(e.tipo));
		function responder(respuesta, destino) {
			acusarEmergencia(e, { respuesta });
			app.reset("inicio");
			if (destino) app.go(destino);
		}
		FullOverlay($$renderer, {
			class: "bg-rojo text-white",
			children: ($$renderer) => {
				$$renderer.push(`<div class="flex flex-1 flex-col gap-4 px-6 pb-10 pt-8 text-center"><div class="flex-1"></div> `);
				Circle($$renderer, {
					emoji: "🚨",
					class: "bg-white"
				});
				$$renderer.push(`<!----> <h1 class="text-3xl font-black">EMERGENCIA EN TU SECTOR</h1> <p class="text-xl font-black">${escape_html(tipo().emoji)} ${escape_html(tipo().label)} · Mz. ${escape_html(e.manzana)} y alrededores</p> `);
				if (e.texto) $$renderer.push(`<!--[0--><p class="font-semibold opacity-90">“${escape_html(e.texto)}”</p>`);
				else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> <p class="text-sm font-semibold opacity-85">Confirmada por un Guardián ${escape_html(hace(e.confirmedAt))}</p> <div class="flex-1"></div> `);
				Btn($$renderer, {
					variant: "blanco",
					class: "!text-tinta",
					onclick: () => responder("bien"),
					children: ($$renderer) => {
						$$renderer.push(`<!---->✅ Estoy bien`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----> `);
				Btn($$renderer, {
					variant: "blanco",
					class: "!text-rojo-osc",
					onclick: () => responder("ayuda", "pedirAyuda"),
					children: ($$renderer) => {
						$$renderer.push(`<!---->🆘 Necesito ayuda`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----> `);
				Btn($$renderer, {
					variant: "bordeBlanco",
					onclick: () => responder("visto"),
					children: ($$renderer) => {
						$$renderer.push(`<!---->Ver qué pasa`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----></div>`);
			},
			$$slots: { default: true }
		});
	});
}
// src/lib/pantallas/emergencia/FinEmergencia.svelte
function FinEmergencia($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { e } = $$props;
		const ayudaron = derived(() => new Set(datos.needs.filter((n) => n.emergencyId === e.id).map((n) => n.helperId).filter(Boolean)).size);
		function cerrar() {
			acusarEmergencia(e, { finVisto: true });
			app.reset("inicio");
		}
		FullOverlay($$renderer, {
			children: ($$renderer) => {
				Screen($$renderer, {
					class: "text-center",
					children: ($$renderer) => {
						$$renderer.push(`<div class="flex-1"></div> `);
						Circle($$renderer, {
							emoji: "🕊️",
							class: "bg-petroleo-claro"
						});
						$$renderer.push(`<!----> `);
						H1($$renderer, {
							children: ($$renderer) => {
								$$renderer.push(`<!---->La emergencia terminó`);
							},
							$$slots: { default: true }
						});
						$$renderer.push(`<!----> `);
						Sub($$renderer, {
							children: ($$renderer) => {
								$$renderer.push(`<!---->Un Guardián marcó la ${escape_html(emergenciaById(e.tipo).label.toLowerCase())} como atendida. AYNI vuelve a la normalidad.`);
							},
							$$slots: { default: true }
						});
						$$renderer.push(`<!----> <div class="rounded-[20px] bg-morado-claro p-4 text-morado-osc"><div class="text-lg font-black">💜 ${escape_html(ayudaron())} vecino(s) ayudaron</div> <div class="text-sm font-bold">Hoy por ti, mañana por mí.</div></div> <div class="flex-1"></div> `);
						Btn($$renderer, {
							onclick: cerrar,
							children: ($$renderer) => {
								$$renderer.push(`<!---->Volver al inicio`);
							},
							$$slots: { default: true }
						});
						$$renderer.push(`<!---->`);
					},
					$$slots: { default: true }
				});
			},
			$$slots: { default: true }
		});
	});
}
// src/lib/ui/Stepper.svelte
function Stepper($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { value, onChange, min = 1, max = 20 } = $$props;
		const btn = "flex h-12 w-12 items-center justify-center rounded-full border-2 border-linea bg-white text-2xl font-black disabled:opacity-40";
		$$renderer.push(`<div class="flex items-center gap-4"><button type="button" aria-label="Menos"${attr_class(clsx(btn))}${attr("disabled", value <= min, true)}>−</button> <span class="w-6 text-center text-2xl font-black">${escape_html(value)}</span> <button type="button" aria-label="Más"${attr_class(clsx(btn))}${attr("disabled", value >= max, true)}>+</button></div>`);
	});
}
// src/lib/pantallas/emergencia/PedirAyuda.svelte
function PedirAyuda($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const e = derived(() => app.activeEmergency);
		let necesidad = "";
		let quienes = [];
		let cuantas = 1;
		let texto = "";
		let foto = null;
		function pedir() {
			const n = pedirAyuda(e(), {
				necesidad,
				quienes,
				cuantas,
				texto: texto.trim(),
				foto
			});
			app.replace("miPedido", { id: n.id });
		}
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (!e()) {
				$$renderer.push("<!--[0-->");
				Screen($$renderer, {
					children: ($$renderer) => {
						Header($$renderer, {});
						$$renderer.push(`<!----> `);
						H1($$renderer, {
							children: ($$renderer) => {
								$$renderer.push(`<!---->No hay una emergencia activa`);
							},
							$$slots: { default: true }
						});
						$$renderer.push(`<!----> `);
						Sub($$renderer, {
							children: ($$renderer) => {
								$$renderer.push(`<!---->Si algo grave está pasando, repórtalo para que un Guardián lo confirme.`);
							},
							$$slots: { default: true }
						});
						$$renderer.push(`<!----> `);
						Btn($$renderer, {
							variant: "rojo",
							onclick: () => app.replace("reportarEmergencia"),
							children: ($$renderer) => {
								$$renderer.push(`<!---->Reportar emergencia`);
							},
							$$slots: { default: true }
						});
						$$renderer.push(`<!----> `);
						Btn($$renderer, {
							variant: "borde",
							onclick: app.back,
							children: ($$renderer) => {
								$$renderer.push(`<!---->Volver`);
							},
							$$slots: { default: true }
						});
						$$renderer.push(`<!---->`);
					},
					$$slots: { default: true }
				});
			} else {
				$$renderer.push(`<!--[-1--><div class="flex flex-1 flex-col">`);
				EmergencyBanner($$renderer, {
					emergencia: e(),
					tipo: emergenciaById(e().tipo)
				});
				$$renderer.push(`<!----> `);
				Screen($$renderer, {
					class: "gap-3",
					children: ($$renderer) => {
						Header($$renderer, { title: "Pedir ayuda" });
						$$renderer.push(`<!----> `);
						H1($$renderer, {
							children: ($$renderer) => {
								$$renderer.push(`<!---->¿Qué necesitas?`);
							},
							$$slots: { default: true }
						});
						$$renderer.push(`<!----> `);
						OptionGrid($$renderer, {
							options: NECESIDADES,
							value: necesidad,
							onChange: (v) => necesidad = v,
							tone: "rojo"
						});
						$$renderer.push(`<!----> `);
						Field($$renderer, {
							label: "¿Quiénes están contigo? (puedes elegir varios)",
							grupo: true,
							children: ($$renderer) => {
								OptionGrid($$renderer, {
									options: VULNERABLES,
									value: quienes,
									onChange: (v) => quienes = v,
									multi: true,
									tone: "rojo"
								});
							},
							$$slots: { default: true }
						});
						$$renderer.push(`<!----> <div class="flex items-center justify-between"><span class="text-sm font-extrabold text-gris">¿Cuántas personas?</span> `);
						Stepper($$renderer, {
							value: cuantas,
							onChange: (v) => cuantas = v
						});
						$$renderer.push(`<!----></div> `);
						Field($$renderer, {
							label: "Algo más que debamos saber (opcional)",
							children: ($$renderer) => {
								TextArea($$renderer, {
									maxlength: 160,
									placeholder: "Ej: Mi mamá usa silla de ruedas, estamos en el segundo piso.",
									get value() {
										return texto;
									},
									set value($$value) {
										texto = $$value;
										$$settled = false;
									}
								});
							},
							$$slots: { default: true }
						});
						$$renderer.push(`<!----> `);
						PhotoPicker($$renderer, {
							value: foto,
							onChange: (v) => foto = v
						});
						$$renderer.push(`<!----> <div class="text-sm font-semibold text-gris">📍 Zona aproximada: Mz. ${escape_html(app.user.manzana)}. La ubicación exacta solo la ven los Guardianes.</div> `);
						Btn($$renderer, {
							variant: "rojo",
							disabled: !necesidad,
							onclick: pedir,
							children: ($$renderer) => {
								$$renderer.push(`<!---->Pedir ayuda`);
							},
							$$slots: { default: true }
						});
						$$renderer.push(`<!---->`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----></div>`);
			}
			$$renderer.push(`<!--]-->`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
	});
}
// src/lib/pantallas/emergencia/MiPedido.svelte
function MiPedido($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { id } = $$props;
		const n = derived(() => datos.needs.find((x) => x.id === id));
		const e = derived(() => app.activeEmergency);
		const nec = derived(() => n() ? necesidadById(n().necesidad) : null);
		const helper = derived(() => n() ? app.users.find((u) => u.id === n().helperId) : null);
		if (n()) {
			$$renderer.push(`<!--[0--><div class="flex flex-1 flex-col">`);
			if (e()) {
				$$renderer.push("<!--[0-->");
				EmergencyBanner($$renderer, {
					emergencia: e(),
					tipo: emergenciaById(e().tipo)
				});
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			Screen($$renderer, {
				children: ($$renderer) => {
					Header($$renderer, { title: "Tu pedido de ayuda" });
					$$renderer.push(`<!----> <div class="flex items-center gap-3 rounded-[20px] border-2 border-rojo bg-white p-4"><span class="text-3xl" aria-hidden="true">${escape_html(nec().emoji)}</span> <div><div class="font-black">${escape_html(nec().label)} · ${escape_html(n().cuantas)} persona(s)</div> <div class="text-sm font-semibold text-gris">${escape_html(n().quienes.map((q) => VULNERABLES.find((v) => v.id === q)?.emoji).join(" "))} Zona Mz. ${escape_html(n().manzana)}</div></div></div> `);
					if (helper()) {
						$$renderer.push(`<!--[0--><div class="flex flex-col gap-3 rounded-[20px] bg-petroleo-claro p-4"><div class="font-black">🙋 ${escape_html(nombreVisible(helper()))} va en camino</div> <div class="text-sm font-semibold text-gris">Vive en la Mz. ${escape_html(helper().manzana)} · aceptó ${escape_html(hace(n().helperAt))}</div> `);
						if (n().contactPhone) $$renderer.push(`<!--[0--><div class="grid grid-cols-2 gap-2.5"><a${attr("href", `tel:+${stringify(n().contactPhone)}`)} class="flex min-h-[52px] items-center justify-center rounded-2xl bg-petroleo font-black text-white">📞 Llamar</a> <button type="button" class="min-h-[52px] rounded-2xl bg-wa font-black text-white">💬 WhatsApp</button></div>`);
						else $$renderer.push(`<!--[-1--><p class="text-xs font-semibold text-gris">El contacto aparecerá cuando tu celular se sincronice.</p>`);
						$$renderer.push(`<!--]--></div>`);
					} else $$renderer.push(`<!--[-1--><div class="rounded-[20px] border border-ambar bg-ambar-claro p-4 text-sm font-bold">⏳ Tu pedido ya está en el mapa. Te avisaremos cuando un vecino toque “Voy yo”.</div>`);
					$$renderer.push(`<!--]--> `);
					Steps($$renderer, { items: [
						[
							"✅",
							"Pedido publicado",
							hora(n().createdAt),
							true
						],
						[
							helper() ? "✅" : "⏳",
							helper() ? `${nombreVisible(helper())} aceptó ayudarte` : "Esperando a un vecino",
							"",
							true
						],
						[
							n().status === "resuelto" ? "✅" : "⚪",
							"Ayuda recibida",
							"",
							n().status === "resuelto"
						]
					] });
					$$renderer.push(`<!----> <div class="flex-1"></div> `);
					if (n().status !== "resuelto") {
						$$renderer.push("<!--[0-->");
						Btn($$renderer, {
							onclick: () => {
								resolverPedido(n());
								app.reset("inicio");
							},
							children: ($$renderer) => {
								$$renderer.push(`<!---->✅ Ya recibí ayuda`);
							},
							$$slots: { default: true }
						});
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]-->`);
				},
				$$slots: { default: true }
			});
			$$renderer.push(`<!----></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
// src/lib/pantallas/emergencia/Grupos.svelte
function Grupos($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const e = derived(() => app.activeEmergency);
		$$renderer.push(`<div class="flex flex-1 flex-col bg-rojo-fondo">`);
		if (e()) {
			$$renderer.push("<!--[0-->");
			EmergencyBanner($$renderer, {
				emergencia: e(),
				tipo: emergenciaById(e().tipo)
			});
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		Screen($$renderer, {
			class: "gap-3",
			children: ($$renderer) => {
				H1($$renderer, {
					children: ($$renderer) => {
						$$renderer.push(`<!---->Grupos y servicios de apoyo`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----> <!--[-->`);
				const each_array = ensure_array_like(datos.groups);
				for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
					let g = each_array[$$index];
					$$renderer.push(`<div class="flex items-center gap-3 rounded-[20px] border border-linea bg-white p-3.5"><span class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-rojo-claro text-3xl" aria-hidden="true">${escape_html(g.emoji)}</span> <div class="min-w-0 flex-1"><div class="font-black leading-tight">${escape_html(g.name)}</div> <div class="text-sm font-semibold text-gris">${escape_html(g.meta)}</div></div> `);
					if (g.contacto.tipo === "tel") $$renderer.push(`<!--[0--><a${attr("href", `tel:${stringify(g.contacto.valor)}`)} class="flex min-h-[48px] items-center rounded-full bg-rojo px-4 text-sm font-black text-white">📞 ${escape_html(g.contacto.valor)}</a>`);
					else $$renderer.push(`<!--[-1--><button type="button" class="min-h-[48px] rounded-full bg-rojo px-4 text-sm font-black text-white">💬 Escribir</button>`);
					$$renderer.push(`<!--]--></div>`);
				}
				$$renderer.push(`<!--]-->`);
			},
			$$slots: { default: true }
		});
		$$renderer.push(`<!----></div>`);
	});
}
// src/lib/App.svelte
function App($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const SCREENS = {
			portada: Portada,
			tutorial: Tutorial,
			telefono: Telefono,
			codigo: Codigo,
			nombre: Nombre,
			ubicacion: Ubicacion,
			zona: Zona,
			crearSector: CrearSector,
			primerGuardian: PrimerGuardian,
			bienvenida: Bienvenida,
			inicio: Inicio,
			resultados: Resultados,
			servicio: PerfilServicio,
			vistoBueno: DarVistoBueno,
			gracias: Gracias,
			favores: Favores,
			favor: DetalleFavor,
			misPublicaciones: MisPublicaciones,
			favorCerrado: FavorCerrado,
			publicar: Publicar,
			mapa: Mapa,
			apiDocs: ApiDocs,
			pendientesSync: PendientesSync,
			perfil: Perfil,
			ajustes: Ajustes,
			panelGuardian: PanelGuardian,
			invitacionGuardian: InvitacionGuardian,
			guardianAceptado: GuardianAceptado,
			reportar: Reportar,
			reportarEmergencia: ReportarEmergencia,
			reporteEnviado: ReporteEnviado,
			pedirAyuda: PedirAyuda,
			miPedido: MiPedido,
			grupos: Grupos
		};
		const PUBLICAS = /* @__PURE__ */ new Set([
			"portada",
			"tutorial",
			"telefono",
			"codigo",
			"nombre",
			"ubicacion",
			"zona",
			"crearSector",
			"ajustes",
			"apiDocs"
		]);
		const SIN_AVISOS = /* @__PURE__ */ new Set([
			...PUBLICAS,
			"primerGuardian",
			"bienvenida"
		]);
		const CON_BARRA = /* @__PURE__ */ new Set([
			"inicio",
			"favores",
			"mapa",
			"perfil",
			"grupos",
			"misPublicaciones",
			"panelGuardian"
		]);
		const nombre = derived(() => !app.user && !PUBLICAS.has(app.route.name) ? "portada" : app.route.name);
		const Pantalla = derived(() => SCREENS[nombre()] ?? Inicio);
		const conBarra = derived(() => Boolean(app.user) && CON_BARRA.has(nombre()));
		derived(() => `${app.stack.length}-${nombre()}`);
		const items = derived(() => app.activeEmergency ? [
			[
				"inicio",
				"🚨",
				"nav.ahora"
			],
			[
				"mapa",
				"🗺️",
				"nav.mapa"
			],
			["+"],
			[
				"grupos",
				"👥",
				"nav.grupos"
			],
			[
				"perfil",
				"👤",
				"nav.yo"
			]
		] : [
			[
				"inicio",
				"🏠",
				"nav.inicio"
			],
			[
				"favores",
				"🤝",
				"nav.favores"
			],
			["+"],
			[
				"mapa",
				"🗺️",
				"nav.mapa"
			],
			[
				"perfil",
				"👤",
				"nav.yo"
			]
		]);
		const aviso = derived(() => {
			const u = app.user;
			if (!u || SIN_AVISOS.has(nombre())) return null;
			const em = datos.emergencies;
			const respuesta = em.find((e) => e.reporterId === u.id && !e.reporterSeen && (e.status === "activa" || e.status === "descartada"));
			if (respuesta) return {
				tipo: "resultado",
				e: respuesta
			};
			const fin = em.find((e) => e.sectorId === u.sectorId && e.status === "atendida" && !e.endSeen?.[u.id] && Date.now() - e.endedAt < 1728e5);
			if (fin) return {
				tipo: "fin",
				e: fin
			};
			const alerta = em.find((e) => e.sectorId === u.sectorId && e.status === "activa" && !e.acks?.[u.id]);
			if (alerta) return {
				tipo: "alerta",
				e: alerta
			};
			if (!app.isGuardian && !u.inviteAnswered && diasEnAyni(u) >= 60) return { tipo: "invitacion" };
			return null;
		});
		$$renderer.push(`<div class="relative mx-auto flex min-h-dvh max-w-[430px] flex-col bg-crema shadow-[0_0_40px_rgba(15,76,92,.12)]"><main${attr_class(`flex flex-1 flex-col ${conBarra() ? "pb-28" : ""}`)}><!---->`);
		if (Pantalla()) {
			$$renderer.push("<!--[-->");
			Pantalla()($$renderer, spread_props([app.route.params]));
			$$renderer.push("<!--]-->");
		} else {
			$$renderer.push("<!--[!-->");
			$$renderer.push("<!--]-->");
		}
		$$renderer.push(`<!----></main> `);
		if (conBarra()) {
			$$renderer.push(`<!--[0--><nav class="fixed inset-x-0 bottom-0 z-30 mx-auto flex h-[84px] max-w-[430px] items-start justify-around border-t border-linea bg-white px-2 pt-2" aria-label="Navegación principal"><!--[-->`);
			const each_array = ensure_array_like(items());
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let [name, icon, label] = each_array[$$index];
				if (name === "+") $$renderer.push(`<!--[0--><button type="button"${attr("aria-label", app.activeEmergency ? "Pedir ayuda" : app.t("nav.publicar"))}${attr_class(`-mt-6 flex h-[60px] w-[60px] items-center justify-center rounded-full text-4xl font-black text-white shadow-lg ${app.activeEmergency ? "bg-rojo" : "bg-morado"}`)}>+</button>`);
				else $$renderer.push(`<!--[-1--><button type="button"${attr("aria-current", nombre() === name ? "page" : void 0)}${attr_class(`flex min-h-[56px] w-16 flex-col items-center justify-center gap-0.5 text-xs font-extrabold ${nombre() === name ? app.activeEmergency ? "text-rojo" : "text-petroleo" : "text-gris"}`)}><span class="text-[22px]" aria-hidden="true">${escape_html(icon)}</span> ${escape_html(app.t(label))}</button>`);
				$$renderer.push(`<!--]-->`);
			}
			$$renderer.push(`<!--]--></nav>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (aviso()?.tipo === "resultado") {
			$$renderer.push("<!--[0-->");
			ResultadoReporte($$renderer, { e: aviso().e });
		} else if (aviso()?.tipo === "fin") {
			$$renderer.push("<!--[1-->");
			FinEmergencia($$renderer, { e: aviso().e });
		} else if (aviso()?.tipo === "alerta") {
			$$renderer.push("<!--[2-->");
			AlertaEmergencia($$renderer, { e: aviso().e });
		} else if (aviso()?.tipo === "invitacion") {
			$$renderer.push("<!--[3-->");
			InvitacionSheet($$renderer, {});
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (app.toast) $$renderer.push(`<!--[0--><div role="status" class="fixed inset-x-0 top-4 z-[60] mx-auto w-fit max-w-[90%] rounded-2xl bg-tinta px-4 py-3 text-center text-sm font-bold text-white shadow-lg">${escape_html(app.toast)}</div>`);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div>`);
	});
}
// src/routes/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		App($$renderer, {});
	});
}
export { _page as default };

//# sourceMappingURL=_page.svelte.js.map