/* ==================================================================
 *  Acciones de AYNI: el ÚNICO lugar donde las pantallas cambian datos.
 *  Cada acción: 1) aplica el cambio en la copia local (la app responde al instante
 *  y funciona sin señal), 2) lo encola con un op_id (sync/cola.js) y 3) sincroniza
 *  si hay conexión. Las reglas son las del prototipo; el servidor las vuelve a validar.
 * ================================================================== */
import { db, save, uid } from './storage.js';
import { app } from './estado.svelte.js';
import { api, ErrorApi, get, post } from './api/cliente.js';
import * as A from './api/adaptadores.js';
import { encolar } from './sync/cola.js';
import { sincronizar } from './sync/motor.js';
import { abrirEnlace } from './util.js';
import { setLocale } from '$lib/i18n';
import { browser } from '$app/environment';

const ahoraIso = () => new Date().toISOString();

export const MODO_DEMO = {
  PHONE: '900000001',
  CODE: '1234',
  SECTOR_ID: 'demo-sector-1',
  USER_ID: 'demo-user-1',
};

const PHONE_DEMO = MODO_DEMO.PHONE;
const CODE_DEMO = MODO_DEMO.CODE;
const SECTOR_DEMO_ID = MODO_DEMO.SECTOR_ID;
const USER_DEMO_ID = MODO_DEMO.USER_ID;

function esDemo(celular, codigo) {
  return celular === PHONE_DEMO && codigo === CODE_DEMO;
}

function op(entidad, operacion, payload, ref, descripcion) {
  encolar({ entidad, operacion, payload, ref, descripcion, usuarioId: app.user?.id });
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

/* ========================= MODO DEMO LOCAL (sin backend) ========================= */

const SECTOR_DEMO = {
  id: SECTOR_DEMO_ID,
  name: 'Los Álamos · Sector 3',
  manzanas: ['A', 'B', 'C', 'D', 'E', 'F'],
  guardianIds: [USER_DEMO_ID],
};

const USUARIO_DEMO = {
  id: USER_DEMO_ID,
  firstName: 'Rosa',
  lastName: 'Mendoza',
  phone: PHONE_DEMO,
  sectorId: SECTOR_DEMO_ID,
  manzana: 'A',
  lat_aprox: -12.046374,
  lng_aprox: -77.042793,
  isGuardian: true,
  inviteAnswered: 'aceptada',
  createdAt: new Date().toISOString(),
};

async function verificarCodigoDemo() {
  return { 
    tipo: 'sesion', 
    usuario: { ...USUARIO_DEMO } 
  };
}

async function cargarSectoresPublicosDemo() {
  const sectorLocal = A.sectorALocal(SECTOR_DEMO);
  guardarLocal('sectors', sectorLocal);
  return [SECTOR_DEMO];
}

async function registrarDemo(draft, { sectorId, sectorNuevo, manzana }) {
  const lat_aprox = draft.lat_aprox ?? draft.location?.lat;
  const lng_aprox = draft.lng_aprox ?? draft.location?.lng;
  
  const usuario = {
    ...USUARIO_DEMO,
    firstName: draft.firstName,
    lastName: draft.lastName ?? '',
    manzana: manzana || 'A',
    sectorId: sectorId || SECTOR_DEMO_ID,
    ...(lat_aprox != null && lng_aprox != null ? { lat_aprox, lng_aprox } : {}),
    ...(draft.address ? { direccion: draft.address } : {}),
    geo_provider: draft.geo_provider || null,
    geo_lastUpdate: draft.geo_lastUpdate || Date.now(),
    idioma: app.settings.lang,
  };
  
  const sector = sectorNuevo 
    ? { id: uid(), name: sectorNuevo.name, manzanas: sectorNuevo.manzanas, guardianIds: [usuario.id] }
    : SECTOR_DEMO;
  
  guardarLocal('sectors', A.sectorALocal(sector));
  guardarLocal('users', A.usuarioALocal(usuario));
  
  return { usuario };
}

/* ================================================================ acceso */
export async function cargarEstadoServidor() {
  try {
    app.servidor = await get('/estado');
  } catch {
    /* sin conexión: se usa lo último conocido */
  }
}

export async function cargarSectoresPublicos() {
  try {
    return await cargarSectoresPublicosDemo();
  } catch {
    const lista = await get('/sectores');
    for (const s of lista) guardarLocal('sectors', A.sectorALocal(s));
    return lista;
  }
}

export const solicitarCodigo = (celular) => {
  if (celular === PHONE_DEMO) {
    return Promise.resolve({ enviado: true, demo: true, codigo_demo: CODE_DEMO });
  }
  return post('/auth/otp/solicitar', { telefono: celular });
};

export const verificarCodigo = async (celular, codigo) => {
  if (esDemo(celular, codigo)) {
    return verificarCodigoDemo();
  }
  return post('/auth/otp/verificar', { telefono: celular, codigo, plataforma: 'web' });
};

/** Crea la cuenta (con el token de registro que dejó verificarCodigo en la cookie). */
export async function registrar(draft, { sectorId, sectorNuevo, manzana }) {
  const draftPhone = draft.phone ?? draft.location?.phone;
  if (esDemo(draftPhone, CODE_DEMO)) {
    return registrarDemo(draft, { sectorId, sectorNuevo, manzana });
  }
  const lat_aprox = draft.lat_aprox ?? draft.location?.lat;
  const lng_aprox = draft.lng_aprox ?? draft.location?.lng;
  const payload = {
    nombre: draft.firstName,
    apellido: draft.lastName ?? '',
    manzana,
    ...(sectorNuevo ? { sector_nuevo: { id: uid(), nombre: sectorNuevo.name, manzanas: sectorNuevo.manzanas } } : { sector_id: sectorId }),
    ...(lat_aprox != null && lng_aprox != null ? { lat_aprox, lng_aprox } : {}),
    ...(draft.address ? { direccion: draft.address } : {}),
    idioma: app.settings.lang,
  };
  const res = await post('/auth/registro', payload);
  if (browser && res.usuario?.idioma) {
    setLocale(res.usuario.idioma);
    app.setSettings((s) => ({ ...s, lang: res.usuario.idioma }));
    localStorage.setItem('idioma', res.usuario.idioma);
    localStorage.setItem('ayni_settings', JSON.stringify({ ...app.settings, lang: res.usuario.idioma }));
  }
  return res;
}

/** Deja la sesión abierta en este celular y descarga los datos del sector. */
export async function entrar(usuarioDto, pantalla = 'inicio') {
  guardarLocal('users', A.usuarioALocal(usuarioDto));
  app.startSession(usuarioDto.id, pantalla);

  // Aplicar el idioma del perfil del servidor (hidiátrico cross-dispositivo).
  if (browser && usuarioDto.idioma) {
    setLocale(usuarioDto.idioma);
    app.setSettings((s) => ({ ...s, lang: usuarioDto.idioma }));
    localStorage.setItem('idioma', usuarioDto.idioma);
    localStorage.setItem('ayni_settings', JSON.stringify({ ...app.settings, lang: usuarioDto.idioma }));
  }

  await sincronizar({ completo: true });
}

export async function cerrarSesion() {
  try {
    await post('/auth/logout');
  } catch {
    /* sin señal: la sesión del servidor vence sola */
  }
  // La cola (outbox) NO se borra: lo pendiente se enviará cuando esta persona vuelva a entrar.
  for (const c of ['users', 'services', 'recommendations', 'contacts', 'favors', 'reports', 'moderation', 'emergencies', 'needs', 'groups']) save(c, []);
  save('syncCursor', null);
  app.endSession();
}

/* ================================================================ perfil */
export function actualizarPerfil(patch) {
  const u = app.user;
  if (!u) return;
  db.update('users', u.id, patch);
  const dto = A.perfilADto(patch);
  if (Object.keys(dto).length) op('usuarios', 'actualizar', dto, { col: 'users', id: u.id }, 'Cambio de tu perfil');
  return enviar();
}

export function responderInvitacion(acepta) {
  const u = app.user;
  const s = app.sector;
  db.update('users', u.id, { inviteAnswered: acepta ? 'aceptada' : 'despues', ...(acepta ? { isGuardian: true } : {}) });
  if (acepta && s) db.update('sectors', s.id, (x) => ({ guardianIds: [...new Set([...(x.guardianIds ?? []), u.id])] }));
  op('usuarios', 'actualizar', { accion: 'invitacion', respuesta: acepta ? 'aceptada' : 'despues' }, { col: 'users', id: u.id }, 'Respuesta a la invitación de Guardián');
  return enviar();
}

/* ============================================================== servicios */
export function guardarServicio(data, existente) {
  const u = app.user;
  if (existente) {
    db.update('services', existente.id, data);
    op('servicios', 'actualizar', { id: existente.id, ...A.servicioADto({ ...existente, ...data }), actualizado_en: ahoraIso() }, { col: 'services', id: existente.id }, `Editar "${data.titulo}"`);
  } else {
    const id = uid();
    db.create('services', { ...data, id, ownerId: u.id, status: 'pendiente', hidden: false, baseVistos: 0, baseTags: {} });
    op('servicios', 'crear', { id, ...A.servicioADto(data) }, { col: 'services', id }, `Publicar "${data.titulo}"`);
  }
  return enviar();
}

export function pausarServicio(s) {
  const estado = s.status === 'pausado' ? 'disponible' : 'pausado';
  db.update('services', s.id, { status: estado });
  op('servicios', 'actualizar', { id: s.id, estado, actualizado_en: ahoraIso() }, { col: 'services', id: s.id }, estado === 'pausado' ? 'Pausar publicación' : 'Activar publicación');
  return enviar();
}

export function eliminarPublicacion(col, id) {
  db.remove(col, id);
  op(col === 'services' ? 'servicios' : 'favores', 'eliminar', { id }, { col, id }, 'Eliminar publicación');
  return enviar();
}

/** "Escribir por WhatsApp": el servidor anota el contacto y devuelve el enlace (el número nunca se lista). */
export async function contactarServicio(s) {
  const id = uid();
  if (app.online) {
    try {
      const c = await post(`/servicios/${s.id}/contacto`, { id });
      guardarLocal('contacts', A.contactoALocal(c));
      if (c.whatsapp_url) abrirEnlace(c.whatsapp_url);
      return;
    } catch (e) {
      if (!(e instanceof ErrorApi) || !e.esDeRed) return app.notify(e.message);
    }
  }
  if (!db.list('contacts').some((c) => c.serviceId === s.id && c.userId === app.user.id && !c.answered)) {
    db.create('contacts', { id, serviceId: s.id, userId: app.user.id, answered: false, attended: null });
    op('contactos', 'crear', { id, servicio_id: s.id }, { col: 'contacts', id }, `Contacto con ${s.titulo}`);
  }
  app.notify('Sin señal: WhatsApp necesita internet. Te avisaremos para recomendarlo cuando vuelva la conexión.');
}

export function responderContacto(contacto, attended) {
  db.update('contacts', contacto.id, { answered: true, attended });
  op('contactos', 'actualizar', { id: contacto.id, atendido: attended }, { col: 'contacts', id: contacto.id }, '¿Te atendió?');
  return enviar();
}

export function darVistoBueno(serviceId, tags, comment) {
  const id = uid();
  db.create('recommendations', { id, serviceId, userId: app.user.id, tags, comment });
  op('recomendaciones', 'crear', { id, servicio_id: serviceId, etiquetas: tags, comentario: comment }, { col: 'recommendations', id }, 'Visto Bueno');
  return enviar();
}

/* ================================================================ favores */
export function guardarFavor(data, existente) {
  const u = app.user;
  if (existente) {
    db.update('favors', existente.id, data);
    op('favores', 'actualizar', { id: existente.id, ...A.favorADto({ ...existente, ...data }), actualizado_en: ahoraIso() }, { col: 'favors', id: existente.id }, `Editar "${data.titulo}"`);
  } else {
    const id = uid();
    db.create('favors', { ...data, id, ownerId: u.id, status: 'pendiente', hidden: false, takerId: null, reservedAt: null, ownerConfirmed: false, takerConfirmed: false });
    op('favores', 'crear', { id, ...A.favorADto(data) }, { col: 'favors', id }, `Publicar "${data.titulo}"`);
  }
  return enviar();
}

/** "Lo quiero / Puedo ayudar": reserva por 1 hora y gana el primero. Con señal se confirma al instante. */
export async function reservarFavor(f) {
  if (app.online) {
    try {
      const r = await post(`/favores/${f.id}/reservar`);
      guardarLocal('favors', A.favorALocal(r));
      if (r.whatsapp_url) abrirEnlace(r.whatsapp_url);
      app.notify('Se abrió WhatsApp. Queda reservado para ti por 1 hora.');
      return true;
    } catch (e) {
      if (!(e instanceof ErrorApi) || !e.esDeRed) {
        app.notify(e.message);
        sincronizar({ completo: true });
        return false;
      }
    }
  }
  db.update('favors', f.id, { status: 'reservado', takerId: app.user.id, reservedAt: Date.now(), ownerConfirmed: false, takerConfirmed: false });
  op('favores', 'actualizar', { id: f.id, accion: 'reservar' }, { col: 'favors', id: f.id }, `Reservar "${f.titulo}"`);
  app.notify('🕓 Sin señal: tu reserva se enviará al volver la conexión (gana quien llegue primero).');
  return true;
}

export function liberarFavor(f) {
  db.update('favors', f.id, { status: 'disponible', takerId: null, reservedAt: null, ownerConfirmed: false, takerConfirmed: false });
  op('favores', 'actualizar', { id: f.id, accion: 'liberar' }, { col: 'favors', id: f.id }, `Liberar "${f.titulo}"`);
  return enviar();
}

/** Confirma un lado del favor. Si ambos confirmaron, queda "Cerrado y confirmado". Devuelve true si se cerró. */
export function confirmarFavor(favor, lado) {
  const cambios = { [lado === 'owner' ? 'ownerConfirmed' : 'takerConfirmed']: true };
  const otro = lado === 'owner' ? favor.takerConfirmed : favor.ownerConfirmed;
  if (otro) Object.assign(cambios, { status: 'cerrado', closedAt: Date.now() });
  db.update('favors', favor.id, cambios);
  op('favores', 'actualizar', { id: favor.id, accion: 'listo' }, { col: 'favors', id: favor.id }, `"Listo" en "${favor.titulo}"`);
  enviar();
  return Boolean(otro);
}

/** Enlace de WhatsApp con la otra persona de una reserva (lo entrega el servidor). */
export async function whatsappFavor(f) {
  try {
    const d = await get(`/favores/${f.id}`);
    if (d.whatsapp_url) return abrirEnlace(d.whatsapp_url);
  } catch {
    /* sin señal */
  }
  app.notify('WhatsApp necesita internet. Inténtalo cuando vuelva la señal.');
}

/* ============================================================== moderación */
export function reportar(col, targetId, motivo) {
  const id = uid();
  db.create('reports', { id, col, targetId, userId: app.user.id, reason: motivo });
  op('reportes', 'crear', { id, objeto_tipo: A.OBJETO_DE_COLECCION[col], objeto_id: targetId, motivo: A.motivoACodigo(motivo) }, { col: 'reports', id }, 'Reporte de publicación');
  return enviar();
}

export function moderar(g, aprobar) {
  db.remove('moderation', g.id);
  db.update(g.col, g.targetId, aprobar ? { hidden: false } : { hidden: true, status: 'oculto' });
  op('moderacion', 'crear', { objeto_tipo: A.OBJETO_DE_COLECCION[g.col], objeto_id: g.targetId, decision: aprobar ? 'aprobar' : 'ocultar' }, { col: g.col, id: g.targetId }, aprobar ? 'Aprobar publicación' : 'Ocultar publicación');
  return enviar();
}

/* ============================================================== emergencia */
export function reportarEmergencia({ tipo, texto, foto, provinciaId = null, distritoId = null, lat_aprox = null, lng_aprox = null }) {
  const u = app.user;
  const id = uid();
  const geo = {
    ...(provinciaId ? { provinciaId } : {}),
    ...(distritoId ? { distritoId } : {}),
    ...(lat_aprox != null ? { lat_aprox } : {}),
    ...(lng_aprox != null ? { lng_aprox } : {}),
  };
  const e = db.create('emergencies', { id, sectorId: u.sectorId, reporterId: u.id, tipo, texto, foto, manzana: u.manzana, ...geo, status: 'pendiente', acks: {}, endSeen: {} });
  op(
    'emergencias',
    'crear',
    {
      id,
      tipo,
      texto,
      foto,
      ...(provinciaId ? { provincia_id: provinciaId } : {}),
      ...(distritoId ? { distrito_id: distritoId } : {}),
      ...(lat_aprox != null ? { lat_aprox } : {}),
      ...(lng_aprox != null ? { lng_aprox } : {}),
    },
    { col: 'emergencies', id },
    'Reporte de emergencia'
  );
  enviar();
  return e;
}

export function confirmarEmergencia(e) {
  const u = app.user;
  db.update('emergencies', e.id, (x) => ({ status: 'activa', confirmedBy: u.id, confirmedAt: Date.now(), acks: { ...(x.acks ?? {}), [u.id]: 'visto' } }));
  op('emergencias', 'actualizar', { id: e.id, accion: 'confirmar' }, { col: 'emergencies', id: e.id }, 'Confirmar emergencia');
  return enviar();
}

export function descartarEmergencia(e, motivo) {
  db.update('emergencies', e.id, { status: 'descartada', motivo, reviewedBy: app.user.id, reviewedAt: Date.now() });
  op('emergencias', 'actualizar', { id: e.id, accion: 'descartar', motivo }, { col: 'emergencies', id: e.id }, 'Descartar reporte');
  return enviar();
}

export function cerrarEmergencia(e) {
  const u = app.user;
  db.update('emergencies', e.id, (x) => ({ status: 'atendida', endedAt: Date.now(), closedBy: u.id, endSeen: { ...(x.endSeen ?? {}), [u.id]: true } }));
  op('emergencias', 'actualizar', { id: e.id, accion: 'atender' }, { col: 'emergencies', id: e.id }, 'Marcar emergencia atendida');
  return enviar();
}

/** Mi respuesta a la alerta, si vi el fin de la emergencia y (si la reporté) si vi la respuesta del Guardián. */
export function acusarEmergencia(e, { respuesta, finVisto, reporteroVisto }) {
  const u = app.user;
  db.update('emergencies', e.id, (x) => ({
    ...(respuesta ? { acks: { ...(x.acks ?? {}), [u.id]: respuesta } } : {}),
    ...(finVisto ? { endSeen: { ...(x.endSeen ?? {}), [u.id]: true } } : {}),
    ...(reporteroVisto ? { reporterSeen: true } : {}),
  }));
  op(
    'emergencia_acuses',
    'actualizar',
    { emergencia_id: e.id, ...(respuesta ? { respuesta } : {}), ...(finVisto ? { fin_visto: true } : {}), ...(reporteroVisto ? { reportero_visto: true } : {}) },
    { col: 'emergencies', id: e.id },
    'Respuesta a la alerta'
  );
  return enviar();
}

export function pedirAyuda(e, { necesidad, quienes, cuantas, texto, foto }) {
  const u = app.user;
  const id = uid();
  const n = db.create('needs', { id, emergencyId: e.id, ownerId: u.id, necesidad, quienes, cuantas, texto, foto, manzana: u.manzana, status: 'abierto', helperId: null });
  op('pedidos_ayuda', 'crear', { id, emergencia_id: e.id, necesidad, vulnerables: quienes, cuantas, texto, foto }, { col: 'needs', id }, 'Pedido de ayuda');
  enviar();
  return n;
}

export function ayudarPedido(n) {
  db.update('needs', n.id, { status: 'en_camino', helperId: app.user.id, helperAt: Date.now() });
  op('pedidos_ayuda', 'actualizar', { id: n.id, accion: 'ayudar' }, { col: 'needs', id: n.id }, '"Voy yo"');
  return enviar();
}

export function resolverPedido(n) {
  db.update('needs', n.id, { status: 'resuelto', resolvedAt: Date.now() });
  op('pedidos_ayuda', 'actualizar', { id: n.id, accion: 'resolver' }, { col: 'needs', id: n.id }, 'Ayuda recibida');
  return enviar();
}

/* ============================================ herramientas de demostración */
async function demo(ruta, body) {
  if (!app.online) {
    app.notify('Las herramientas de demostración necesitan conexión con el servidor.');
    return false;
  }
  try {
    await api('POST', ruta, body ?? {});
    await sincronizar({ completo: true });
    return true;
  } catch (e) {
    app.notify(e.message);
    return false;
  }
}

export const demoGuardian = (activo) => demo('/demo/guardian', { activo });
export const demoAntiguedad = () => demo('/demo/antiguedad', { dias: 61 });
export const demoConfirmarOtro = (f) => demo(`/demo/favores/${f.id}/confirmar-otro`);
export async function demoReiniciar() {
  const ok = await demo('/demo/reiniciar');
  if (ok) await cerrarSesion();
  return ok;
}
