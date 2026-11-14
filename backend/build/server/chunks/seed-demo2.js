import { t as config } from "./config2.js";
import { r as uuidDe } from "./ids.js";
// src/lib/server/db/seed-demo.ts
/**
* Datos de demostración (los mismos de frontend/src/seed.js, ahora en el servidor).
* Un sector con vecinos, servicios, favores, Vistos Buenos y grupos de apoyo.
* - Solo se cargan si AYNI_DEMO=true y la base está vacía (o con db:reiniciar-demo).
* - Los ids son UUID estables derivados del id original ("u-rosa" → siempre el mismo UUID).
* - Teléfonos de demo: 51 9000000NN (Rosa = 900000001 en la pantalla de ingreso).
*/
var DIA = 864e5;
var MIN = 6e4;
var hace = (ms) => new Date(Date.now() - ms);
var id = (x) => uuidDe(x);
var DEMO = {
	sector: id("s-jardines"),
	rosa: id("u-rosa"),
	telefonoRosa: "51900000001"
};
var VECINOS = [
	[
		"u-rosa",
		"Rosa",
		"Mendoza",
		"B",
		36
	],
	[
		"u-carmen",
		"Carmen",
		"Rojas",
		"C",
		210,
		{ invitacion: "aceptada" }
	],
	[
		"u-luis",
		"Luis",
		"Quispe",
		"D",
		180,
		{ completo: true }
	],
	[
		"u-marco",
		"Marco",
		"Salas",
		"F",
		150
	],
	[
		"u-hugo",
		"Hugo",
		"Paredes",
		"E",
		90
	],
	[
		"u-elena",
		"Elena",
		"Huamán",
		"A",
		75
	],
	[
		"u-jorge",
		"Jorge",
		"Torres",
		"C",
		160
	],
	[
		"u-ana",
		"Ana",
		"Mamani",
		"B",
		140
	],
	[
		"u-mariela",
		"Mariela",
		"Flores",
		"F",
		100
	],
	[
		"u-pedro",
		"Pedro",
		"Castillo",
		"A",
		130
	]
];
var SERVICIOS = [
	{
		id: "s-luis",
		dueno: "u-luis",
		titulo: "Gasfitero",
		categoria: "gasfiteria",
		descripcion: "Arreglo fugas, termas y desagües. 12 años de experiencia en el barrio.",
		horario: "Lun–Sáb, 8am–6pm",
		precio: "S/ 30",
		completo: true,
		vistos: 16,
		tags: {
			puntual: 8,
			precio: 7,
			limpio: 5,
			volveria: 4
		}
	},
	{
		id: "s-marco",
		dueno: "u-marco",
		titulo: "Gasfitero",
		categoria: "gasfiteria",
		descripcion: "Instalación de caños, inodoros y lavaderos.",
		horario: "Lun–Vie, 9am–5pm",
		precio: "S/ 35",
		vistos: 12,
		tags: {
			limpio: 6,
			rapido: 5
		}
	},
	{
		id: "s-hugo",
		dueno: "u-hugo",
		titulo: "Gasfitería y termas",
		categoria: "gasfiteria",
		descripcion: "Mantenimiento de termas eléctricas y a gas.",
		horario: "Todos los días, 7am–8pm",
		precio: "S/ 40",
		vistos: 9,
		tags: { amable: 5 }
	},
	{
		id: "s-elena",
		dueno: "u-elena",
		titulo: "Desatoros",
		categoria: "gasfiteria",
		descripcion: "Desatoro de desagües con equipo.",
		horario: "Lun–Sáb, 8am–4pm",
		vistos: 5,
		tags: { volveria: 3 }
	},
	{
		id: "s-pedro",
		dueno: "u-pedro",
		titulo: "Electricista",
		categoria: "electricidad",
		descripcion: "Instalaciones, tableros y cortocircuitos.",
		horario: "Lun–Sáb, 8am–6pm",
		precio: "S/ 40",
		vistos: 10,
		tags: {
			puntual: 6,
			precio: 4
		}
	},
	{
		id: "s-jorge",
		dueno: "u-jorge",
		titulo: "Carpintero",
		categoria: "carpinteria",
		descripcion: "Muebles a medida y reparación de puertas.",
		horario: "Lun–Vie, 8am–5pm",
		vistos: 6,
		tags: { limpio: 4 }
	},
	{
		id: "s-carmen",
		dueno: "u-carmen",
		titulo: "Costurera",
		categoria: "costura",
		descripcion: "Arreglos de ropa, basta y cierres en el día.",
		horario: "Lun–Sáb, 9am–7pm",
		precio: "S/ 5",
		vistos: 14,
		tags: {
			rapido: 8,
			precio: 6
		}
	},
	{
		id: "s-mariela",
		dueno: "u-mariela",
		titulo: "Profesora",
		categoria: "clases",
		descripcion: "Clases de matemática para colegio y Excel básico.",
		horario: "Tardes, 3pm–7pm",
		precio: "S/ 20 la hora",
		vistos: 7,
		tags: { amable: 5 }
	},
	{
		id: "s-ana",
		dueno: "u-ana",
		titulo: "Paseo de mascotas",
		categoria: "mascotas",
		descripcion: "Paseo de perros por el parque, mañanas.",
		horario: "Lun–Vie, 7am–10am",
		precio: "S/ 10",
		vistos: 8,
		tags: { puntual: 5 }
	},
	{
		id: "s-ana-pan",
		dueno: "u-ana",
		clase: "producto",
		titulo: "Panes caseros",
		categoria: "comida",
		descripcion: "Pan de yema y ciabatta recién horneados. Pedidos hasta las 6pm.",
		horario: "Todos los días",
		precio: "S/ 0.50 c/u",
		vistos: 11,
		tags: {
			precio: 6,
			volveria: 5
		}
	},
	{
		id: "s-sospechoso",
		dueno: "u-marco",
		clase: "producto",
		titulo: "Celular nuevo",
		categoria: "otros",
		descripcion: "Vendo celular nuevo a S/ 50, pago adelantado.",
		horario: "—",
		precio: "S/ 50",
		vistos: 0
	}
];
var FAVORES = [
	{
		id: "f-escalera",
		dueno: "u-jorge",
		tipo: "presto",
		titulo: "Escalera de 3 metros",
		detalles: {
			duracion: "1 día",
			condicion: "Devolverla limpia, por favor 🙏"
		},
		creado: 10 * MIN
	},
	{
		id: "f-ladrillos",
		dueno: "u-ana",
		tipo: "regalo",
		titulo: "20 ladrillos y una bolsa de cemento",
		detalles: {
			estado: "Sobrante",
			cantidad: "20 ladrillos, 1 bolsa"
		},
		creado: 60 * MIN
	},
	{
		id: "f-excel",
		dueno: "u-mariela",
		tipo: "intercambio",
		titulo: "Clases de Excel a cambio de clases de pan",
		detalles: {
			ofrezco: "Clases de Excel (2 horas)",
			busco: "Que me enseñen a hacer pan"
		},
		creado: 180 * MIN
	},
	{
		id: "f-taladro",
		dueno: "u-pedro",
		tipo: "pido",
		titulo: "Un taladro prestado para colgar una repisa",
		detalles: {
			clase: "Favor",
			cuando: "Hoy"
		},
		creado: 45 * MIN
	},
	{
		id: "f-olla",
		dueno: "u-rosa",
		tipo: "presto",
		titulo: "Olla grande para 30 personas",
		detalles: {
			duracion: "Unas horas",
			condicion: ""
		},
		creado: 2 * DIA
	},
	{
		id: "f-ropero",
		dueno: "u-pedro",
		tipo: "pido",
		titulo: "Ayuda para cargar un ropero",
		detalles: {
			clase: "Favor",
			cuando: "Hoy"
		},
		creado: 6 * DIA,
		cerrado: {
			tomador: "u-rosa",
			dias: 5
		}
	},
	{
		id: "f-perro",
		dueno: "u-rosa",
		tipo: "pido",
		titulo: "Que me cuiden al perro una tarde",
		detalles: {
			clase: "Favor",
			cuando: "Esta semana"
		},
		creado: 13 * DIA,
		cerrado: {
			tomador: "u-mariela",
			dias: 12
		}
	},
	{
		id: "f-carretilla",
		dueno: "u-jorge",
		tipo: "presto",
		titulo: "Carretilla",
		detalles: { duracion: "1 día" },
		creado: 21 * DIA,
		cerrado: {
			tomador: "u-ana",
			dias: 20
		}
	},
	{
		id: "f-arena",
		dueno: "u-jorge",
		tipo: "regalo",
		titulo: "Media cubeta de arena fina",
		detalles: {
			estado: "Sobrante",
			cantidad: "Media cubeta"
		},
		creado: 31 * DIA,
		cerrado: {
			tomador: "u-pedro",
			dias: 30
		}
	}
];
var GRUPOS = [
	[
		"g-bomberos",
		"🚒",
		"Bomberos voluntarios",
		"Compañía cercana · a 8 cuadras",
		null,
		"A",
		"tel",
		"116"
	],
	[
		"g-posta",
		"🏥",
		"Posta médica",
		"Abierta 24 h · a 6 cuadras",
		"salud",
		"E",
		"tel",
		"106"
	],
	[
		"g-enfermera",
		"🩺",
		"Enfermera vecina (Carmen)",
		"Primeros auxilios · Mz. C",
		"salud",
		"C",
		"wa",
		"51900001234"
	],
	[
		"g-olla",
		"🍲",
		"Olla común Los Jardines",
		"Mz. F · almuerzos solidarios",
		"comida",
		"F",
		"wa",
		"51900002345"
	],
	[
		"g-agua1",
		"💧",
		"Punto de agua · Parque",
		"Cisterna comunitaria",
		"agua",
		"D",
		"wa",
		"51900003456"
	],
	[
		"g-agua2",
		"💧",
		"Punto de agua · Mz. A",
		"Bidones disponibles",
		"agua",
		"A",
		"wa",
		"51900003457"
	],
	[
		"g-albergue",
		"🏫",
		"Albergue · Colegio N.° 3045",
		"Capacidad 80 personas",
		"refugio",
		"E",
		"tel",
		"105"
	],
	[
		"g-generador",
		"🔌",
		"Generador vecinal",
		"Carga de celulares · Mz. B",
		"energia",
		"B",
		"wa",
		"51900004567"
	],
	[
		"g-traslado",
		"🚐",
		"Movilidad solidaria",
		"4 vecinos con auto",
		"traslado",
		"C",
		"wa",
		"51900005678"
	],
	[
		"g-brigada",
		"🧰",
		"Brigada vecinal de rescate",
		"6 voluntarios activos",
		null,
		"D",
		"wa",
		"51900006789"
	],
	[
		"g-mascotas",
		"🐾",
		"Rescate de mascotas",
		"2 voluntarios · Mz. A",
		null,
		"A",
		"wa",
		"51900007890"
	]
];
async function cargar(tx) {
	const sectores = [[
		"s-jardines",
		"Los Jardines · Sector 3",
		[
			"A",
			"B",
			"C",
			"D",
			"E",
			"F"
		],
		200,
		["u-carmen"]
	], [
		"s-alameda",
		"La Alameda · Sector 4",
		[
			"A",
			"B",
			"C",
			"D"
		],
		120,
		[]
	]];
	for (const [sid, nombre, manzanas, dias] of sectores) {
		await tx.query("INSERT INTO sectores (id, nombre, creado_en) VALUES ($1, $2, $3)", [
			id(sid),
			nombre,
			hace(dias * DIA)
		]);
		for (const m of manzanas) await tx.query("INSERT INTO sector_manzanas (sector_id, letra) VALUES ($1, $2)", [id(sid), m]);
	}
	let n = 1;
	for (const [uid, nombre, apellido, mz, dias, extra = {}] of VECINOS) {
		await tx.query(`INSERT INTO usuarios (id, nombre, apellido, telefono, sector_id, manzana, verificado, mostrar_nombre_completo, invitacion_guardian, creado_en)
			 VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8, $9)`, [
			id(uid),
			nombre,
			apellido,
			`519000000${String(n).padStart(2, "0")}`,
			DEMO.sector,
			mz,
			Boolean(extra.completo),
			extra.invitacion ?? null,
			hace(dias * DIA)
		]);
		n += 1;
	}
	for (const [sid, , , , guardianes] of sectores) for (const g of guardianes) await tx.query("INSERT INTO sector_guardianes (sector_id, usuario_id) VALUES ($1, $2)", [id(sid), id(g)]);
	for (const s of SERVICIOS) await tx.query(`INSERT INTO servicios (id, dueno_id, clase, categoria, titulo, descripcion, horario, precio, mostrar_nombre_completo, vistos_base, etiquetas_base, creado_en)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`, [
		id(s.id),
		id(s.dueno),
		s.clase ?? "servicio",
		s.categoria,
		s.titulo,
		s.descripcion,
		s.horario,
		s.precio ?? null,
		Boolean(s.completo),
		s.vistos,
		JSON.stringify(s.tags ?? {}),
		hace(60 * DIA)
	]);
	for (const [rid, sid, uid, tags, comentario, dias] of [
		[
			"r1",
			"s-luis",
			"u-carmen",
			["puntual", "precio"],
			"Llegó en 20 minutos y cobró justo.",
			9
		],
		[
			"r2",
			"s-luis",
			"u-pedro",
			["limpio"],
			"Me arregló la terma, muy limpio.",
			4
		],
		[
			"r3",
			"s-carmen",
			"u-ana",
			["rapido"],
			"Me hizo la basta en una hora.",
			2
		]
	]) {
		await tx.query("INSERT INTO contactos (id, servicio_id, usuario_id, respondido, atendido, creado_en) VALUES ($1, $2, $3, true, true, $4)", [
			id(`c-${rid}`),
			id(sid),
			id(uid),
			hace((dias + 1) * DIA)
		]);
		await tx.query("INSERT INTO recomendaciones (id, servicio_id, usuario_id, comentario, creado_en) VALUES ($1, $2, $3, $4, $5)", [
			id(rid),
			id(sid),
			id(uid),
			comentario,
			hace(dias * DIA)
		]);
		for (const t of tags) await tx.query("INSERT INTO recomendacion_etiquetas (recomendacion_id, etiqueta) VALUES ($1, $2)", [id(rid), t]);
	}
	await tx.query("INSERT INTO contactos (id, servicio_id, usuario_id, creado_en) VALUES ($1, $2, $3, $4)", [
		id("c1"),
		id("s-luis"),
		DEMO.rosa,
		hace(DIA)
	]);
	for (const f of FAVORES) {
		const c = f.cerrado;
		await tx.query(`INSERT INTO favores (id, dueno_id, tipo, titulo, detalles, estado, tomador_id, reservado_en, dueno_confirmo, tomador_confirmo, cerrado_en, creado_en)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, $10, $11)`, [
			id(f.id),
			id(f.dueno),
			f.tipo,
			f.titulo,
			JSON.stringify(f.detalles),
			c ? "cerrado" : "disponible",
			c ? id(c.tomador) : null,
			c ? hace(c.dias * DIA + 30 * MIN) : null,
			Boolean(c),
			c ? hace(c.dias * DIA) : null,
			hace(f.creado)
		]);
	}
	const reportes = [
		[
			"rep1",
			"u-ana",
			"estafa",
			180 * MIN
		],
		[
			"rep2",
			"u-pedro",
			"estafa",
			120 * MIN
		],
		[
			"rep3",
			"u-jorge",
			"falso",
			60 * MIN
		]
	];
	for (const [rid, uid, motivo, ms] of reportes) await tx.query("INSERT INTO reportes (id, servicio_id, usuario_id, motivo, creado_en) VALUES ($1, $2, $3, $4, $5)", [
		id(rid),
		id("s-sospechoso"),
		id(uid),
		motivo,
		hace(ms)
	]);
	for (const [gid, emoji, nombre, meta, recurso, mz, tipo, valor] of GRUPOS) await tx.query(`INSERT INTO grupos_apoyo (id, sector_id, emoji, nombre, meta, recurso, manzana, contacto_tipo, contacto_valor, creado_en)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`, [
		id(gid),
		DEMO.sector,
		emoji,
		nombre,
		meta,
		recurso,
		mz,
		tipo,
		valor,
		hace(90 * DIA)
	]);
}
var TABLAS = [
	"sync_operaciones",
	"pedido_vulnerables",
	"pedidos_ayuda",
	"emergencia_acuses",
	"emergencia_confirmaciones",
	"emergencias",
	"grupos_apoyo",
	"reportes",
	"favores",
	"recomendacion_etiquetas",
	"recomendaciones",
	"contactos",
	"servicios",
	"suscripciones_push",
	"sesiones",
	"otp_codigos",
	"sector_guardianes",
	"usuarios",
	"sector_manzanas",
	"sectores"
];
/** Carga la demo solo si está activado el modo demo y aún no hay sectores. */
async function asegurarDatosDemo(db) {
	if (!config().demo) return false;
	const [{ n }] = await db.query("SELECT count(*)::int AS n FROM sectores");
	if (n > 0) return false;
	await db.transaccion(cargar);
	console.info("[AYNI] Datos de demostración cargados (Rosa: celular 900000001, código", config().otpDemo + ")");
	return true;
}
/** Borra TODOS los datos de la aplicación y vuelve a cargar la demo. Solo en modo demo. */
async function reiniciarDemo(db) {
	if (!config().demo) throw new Error("reiniciarDemo solo está permitido con AYNI_DEMO=true");
	await db.transaccion(async (tx) => {
		await tx.exec(`TRUNCATE ${TABLAS.join(", ")} CASCADE`);
		await cargar(tx);
	});
}
export { asegurarDatosDemo as n, reiniciarDemo as r, DEMO as t };

//# sourceMappingURL=seed-demo2.js.map