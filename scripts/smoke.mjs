/**
 * Prueba de humo HTTP de punta a punta contra un backend en marcha (modo demo).
 *   node scripts/smoke.mjs [URL]      (por defecto http://localhost:5180, o AYNI_API_URL)
 * Recorre: estado, OTP + cookie, sesión, permisos, publicaciones, reservas, emergencia,
 * sincronización idempotente y cierre de sesión. No usa mocks: habla con la API real.
 */
const BASE = (process.argv[2] ?? process.env.AYNI_API_URL ?? 'http://localhost:5180').replace(/\/$/, '');
let fallos = 0;
let pasos = 0;

function ok(cond, texto, extra) {
	pasos += 1;
	if (cond) console.log(`  ✓ ${texto}`);
	else {
		fallos += 1;
		console.log(`  ✗ ${texto}`, extra ?? '');
	}
}

/** Cliente con su propia cookie (como un navegador distinto). */
function cliente() {
	let cookie = '';
	return async function api(metodo, ruta, body, headers = {}) {
		const res = await fetch(`${BASE}/api/v1${ruta}`, {
			method: metodo,
			headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...(cookie ? { cookie } : {}), ...headers },
			body: body ? JSON.stringify(body) : undefined
		});
		const set = res.headers.get('set-cookie');
		if (set) {
			const m = /ayni_sesion=([^;]*)/.exec(set);
			if (m) cookie = m[1] ? `ayni_sesion=${m[1]}` : '';
		}
		const texto = await res.text();
		let data = null;
		try {
			data = texto ? JSON.parse(texto) : null;
		} catch {
			data = texto;
		}
		return { status: res.status, data, set };
	};
}

async function entrar(api, celular) {
	await api('POST', '/auth/otp/solicitar', { telefono: celular });
	return api('POST', '/auth/otp/verificar', { telefono: celular, codigo: '1234' });
}

const uuid = () => crypto.randomUUID();

console.log(`AYNI · prueba de humo contra ${BASE}\n`);

console.log('Estado');
const anon = cliente();
const estado = await anon('GET', '/estado');
ok(estado.status === 200 && estado.data?.ok, 'GET /estado responde', estado.data);
ok(estado.data?.demo === true, 'modo demo activo (necesario para el código 1234)');
console.log(`    base de datos: ${estado.data?.base_de_datos}`);

console.log('\nAutenticación');
ok((await anon('GET', '/auth/me')).status === 401, 'sin sesión → 401');
ok((await anon('GET', '/servicios')).status === 401, 'endpoint protegido sin sesión → 401');
const rosa = cliente();
const sol = await rosa('POST', '/auth/otp/solicitar', { telefono: '900000001' });
ok(sol.status === 202, 'POST /auth/otp/solicitar → 202');
ok((await rosa('POST', '/auth/otp/verificar', { telefono: '900000001', codigo: '0000' })).status === 401, 'código incorrecto → 401');
const ver = await rosa('POST', '/auth/otp/verificar', { telefono: '900000001', codigo: '1234' });
ok(ver.status === 200 && ver.data?.tipo === 'sesion', 'código correcto → sesión', ver.data);
ok(/HttpOnly/i.test(ver.set ?? ''), 'la sesión viaja en cookie httpOnly');
const me = await rosa('GET', '/auth/me');
ok(me.status === 200 && me.data?.nombre === 'Rosa', 'GET /auth/me con cookie', me.data);
const bearer = await anon('GET', '/auth/me', null, { authorization: `Bearer ${ver.data?.token}` });
ok(bearer.status === 200 && bearer.data?.id === me.data?.id, 'el mismo token funciona como Bearer');
const falsa = await anon('GET', '/auth/me', null, { cookie: 'ayni_sesion=token-inventado-que-no-existe-123' });
ok(falsa.status === 401, 'una cookie inventada no da acceso');

console.log('\nRegistro de un vecino nuevo');
const nuevo = cliente();
const tel = `9${String(Date.now()).slice(-8)}`;
const reg0 = await entrar(nuevo, tel);
ok(reg0.data?.tipo === 'registro', 'número nuevo → token de registro');
const sectores = await anon('GET', '/sectores');
ok(Array.isArray(sectores.data) && sectores.data.length >= 1, 'GET /sectores (público)');
const sector = sectores.data?.find((s) => s.nombre.startsWith('Los Jardines'));
const reg = await nuevo('POST', '/auth/registro', { nombre: 'Prueba', apellido: 'Humo', sector_id: sector?.id, manzana: 'C' });
ok(reg.status === 201 && reg.data?.usuario?.sector_id === sector?.id, 'POST /auth/registro crea la cuenta', reg.data);

console.log('\nServicios y ownership');
const sid = uuid();
const nuevoServicio = { id: sid, clase: 'servicio', categoria: 'comida', titulo: 'Humitas', descripcion: 'Humitas dulces y saladas por encargo.', horario: 'Sábados' };
const c1 = await rosa('POST', '/servicios', nuevoServicio);
ok(c1.status === 201 && c1.data?.dueno_id === me.data?.id, 'POST /servicios (dueño = sesión)');
ok((await rosa('POST', '/servicios', nuevoServicio)).status === 200, 'reintento con el mismo id → 200 sin duplicar');
ok((await nuevo('PATCH', `/servicios/${sid}`, { titulo: 'Robado' })).status === 403, 'otro vecino no puede editarlo → 403');
const lista = await nuevo('GET', '/servicios?categoria=comida');
ok(lista.data?.items?.some((s) => s.id === sid), 'aparece en el directorio del sector');
ok(lista.data?.items?.every((s) => !('telefono' in (s.dueno ?? {}))), 'el directorio no expone teléfonos');
const inval = await rosa('POST', '/servicios', { ...nuevoServicio, id: uuid(), titulo: 'x' });
ok(inval.status === 422 && inval.data?.codigo, 'datos inválidos → 422 { codigo, mensaje }', inval.data);

console.log('\nFavores: reserva y cierre');
const favores = await rosa('GET', '/favores');
const escalera = favores.data?.items?.find((f) => f.titulo.startsWith('Escalera'));
const res1 = await rosa('POST', `/favores/${escalera?.id}/reservar`);
ok(res1.status === 200 && res1.data?.estado === 'reservado' && res1.data?.whatsapp_url, 'reservar → reservado + enlace WhatsApp');
const res2 = await nuevo('POST', `/favores/${escalera?.id}/reservar`);
ok(res2.status === 409 && res2.data?.codigo === 'RESERVA_OCUPADA', 'otro vecino → 409 RESERVA_OCUPADA');
const lib = await rosa('POST', `/favores/${escalera?.id}/liberar`);
ok(lib.status === 200 && lib.data?.estado === 'disponible', 'liberar → disponible');

console.log('\nEmergencia y permisos de Guardián');
const eid = uuid();
const em = await rosa('POST', '/emergencias', { id: eid, tipo: 'incendio', texto: 'Humo en la Mz. B' });
ok(em.status === 201 && em.data?.estado === 'pendiente', 'reportar emergencia → pendiente');
const noGuardian = await rosa('POST', `/emergencias/${eid}/confirmar`);
ok(noGuardian.status === 403, 'un vecino no Guardián no puede confirmar → 403');
ok((await rosa('POST', `/emergencias/${eid}/confirmar`, null, { 'x-rol': 'Coordinador de emergencia' })).status === 403, 'el encabezado X-Rol ya no otorga permisos');
const carmen = cliente();
await entrar(carmen, '900000002');
const conf = await carmen('POST', `/emergencias/${eid}/confirmar`);
ok(conf.status === 200 && conf.data?.estado === 'activa', 'la Guardiana confirma → activa');
const activa = await nuevo('GET', '/emergencias/activa');
ok(activa.data?.id === eid, 'GET /emergencias/activa la ve todo el sector');
const at = await carmen('POST', `/emergencias/${eid}/atender`);
ok(at.status === 200 && at.data?.estado === 'atendida', 'la Guardiana la marca atendida');

console.log('\nSincronización offline');
const op = uuid();
const fid = uuid();
const lote = { operaciones: [{ op_id: op, entidad: 'favores', operacion: 'crear', creado_en: new Date().toISOString(), payload: { id: fid, tipo: 'regalo', titulo: 'Macetas de barro', detalles: { estado: 'Usado' } } }] };
const p1 = await rosa('POST', '/sync/push', lote);
ok(p1.data?.resultados?.[0]?.resultado === 'aplicada', 'push → aplicada', p1.data);
const p2 = await rosa('POST', '/sync/push', lote);
ok(p2.data?.resultados?.[0]?.resultado === 'duplicada', 'mismo op_id → duplicada (no se repite)');
const pull = await rosa('GET', '/sync/pull');
ok(pull.data?.cambios?.favores?.some((f) => f.id === fid), 'pull trae el favor creado sin conexión');
const inc = await rosa('GET', `/sync/pull?desde=${encodeURIComponent(pull.data?.hasta)}`);
ok(inc.status === 200 && inc.data?.completo === false, 'pull incremental con ?desde');

console.log('\nCierre de sesión');
ok((await rosa('POST', '/auth/logout')).status === 204, 'POST /auth/logout → 204');
ok((await anon('GET', '/auth/me', null, { authorization: `Bearer ${ver.data?.token}` })).status === 401, 'el token revocado ya no sirve');

console.log(`\n${pasos - fallos}/${pasos} comprobaciones OK`);
process.exit(fallos ? 1 : 0);
