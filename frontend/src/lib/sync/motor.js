/* ==================================================================
 *  Motor de sincronización offline-first.
 *  1) PUSH: envía la cola (POST /sync/push). Solo quita una operación cuando el
 *     servidor responde "aplicada" o "duplicada". Sin señal o error del servidor →
 *     reintenta más tarde con el MISMO op_id. Rechazada → queda visible para el vecino.
 *  2) PULL: trae lo que cambió en el sector (GET /sync/pull?desde=cursor) y lo mezcla
 *     en las colecciones locales, sin pisar registros que tienen cambios locales sin confirmar.
 *  Los datos quedan en el celular: la app funciona igual sin conexión.
 * ================================================================== */
import { db, load, save } from '../storage.js';
import { api } from '../api/cliente.js';
import * as A from '../api/adaptadores.js';
import * as cola from './cola.js';

/* ---------- estado observable (para la UI) ---------- */
const oyentes = new Set();
let estado = { sincronizando: false, ultimo: null, error: null };
export const estadoSync = () => estado;
export function suscribirSync(fn) {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}
function cambiar(parcial) {
  estado = { ...estado, ...parcial };
  oyentes.forEach((fn) => fn(estado));
}

const eventos = new Set();
/** Avisos del motor a la app: { tipo: 'sesion-vencida' | 'resultado', ... } */
export function alSincronizar(fn) {
  eventos.add(fn);
  return () => eventos.delete(fn);
}
const avisar = (e) => eventos.forEach((fn) => fn(e));

export function hayConexion() {
  const ajustes = load('settings', {});
  const red = typeof navigator === 'undefined' ? true : navigator.onLine !== false;
  return red && !ajustes.forceOffline;
}

/* ---------- mezcla de datos del servidor ---------- */
function mezclar(col, items, convertir, { completo, locales, eliminados = [] }) {
  const actuales = db.list(col);
  const nuevos = items.map(convertir);
  const tieneCambios = (id) => locales.has(`${col}:${id}`);
  if (completo) {
    const delServidor = new Set(nuevos.map((n) => n.id));
    const actualesPorId = new Map(actuales.map((x) => [x.id, x]));
    // Lo creado sin conexión que el servidor aún no conoce se conserva.
    const soloLocales = actuales.filter((x) => !delServidor.has(x.id) && tieneCambios(x.id));
    const final = nuevos.map((n) => (tieneCambios(n.id) && actualesPorId.has(n.id) ? actualesPorId.get(n.id) : n));
    save(col, [...soloLocales, ...final]);
    return;
  }
  if (!nuevos.length && !eliminados.length) return;
  const porId = new Map(actuales.map((x) => [x.id, x]));
  for (const n of nuevos) if (!tieneCambios(n.id)) porId.set(n.id, n);
  for (const id of eliminados) if (!tieneCambios(id)) porId.delete(id);
  save(col, [...porId.values()]);
}

export function aplicarCambios(datos, yoId) {
  const c = datos.cambios ?? {};
  const completo = Boolean(datos.completo);
  const locales = cola.idsConCambiosLocales(yoId);
  const yo = c.yo ? A.usuarioALocal(c.yo) : null;
  const sectorId = yo?.sectorId ?? db.get('users', yoId)?.sectorId;

  const vecinos = (c.usuarios ?? []).map((v) => A.vecinoALocal(v, sectorId));
  if (yo) {
    const i = vecinos.findIndex((v) => v.id === yo.id);
    if (i >= 0) vecinos.splice(i, 1);
    vecinos.push(yo);
  }
  mezclar('users', vecinos, (x) => x, { completo, locales: new Set() });

  mezclar('sectors', c.sectores ?? [], A.sectorALocal, { completo: false, locales: new Set() });
  mezclar('services', c.servicios ?? [], A.servicioALocal, { completo, locales, eliminados: datos.eliminados?.servicios });
  mezclar('recommendations', c.recomendaciones ?? [], A.recomendacionALocal, { completo, locales });
  mezclar('contacts', c.contactos ?? [], A.contactoALocal, { completo, locales });
  mezclar('favors', c.favores ?? [], A.favorALocal, { completo, locales, eliminados: datos.eliminados?.favores });
  mezclar('emergencies', c.emergencias ?? [], (e) => A.emergenciaALocal(e, yoId), { completo, locales });
  mezclar('needs', c.pedidos_ayuda ?? [], A.pedidoALocal, { completo, locales });
  mezclar('groups', c.grupos_apoyo ?? [], A.grupoALocal, { completo, locales });
  // Mis reportes y el panel de moderación llegan completos en cada descarga.
  mezclar('reports', c.reportes ?? [], A.reporteALocal, { completo: true, locales });
  mezclar('moderation', c.moderacion ?? [], A.moderacionALocal, { completo: true, locales: new Set() });
}

/* ---------- ciclo de sincronización ---------- */
async function enviarCola(usuarioId, resultado) {
  for (let vuelta = 0; vuelta < 10; vuelta += 1) {
    const ops = cola.listasParaEnviar(usuarioId);
    if (!ops.length) return;
    let r;
    try {
      r = await api('POST', '/sync/push', {
        operaciones: ops.map(({ op_id, entidad, operacion, payload, creado_en }) => ({ op_id, entidad, operacion, payload, creado_en })),
      });
    } catch (e) {
      if (e.status === 401) throw e;
      cola.programarReintento(ops.map((o) => o.op_id), e.message);
      resultado.error = e;
      return;
    }
    const confirmadas = [];
    for (const res of r.resultados ?? []) {
      if (res.resultado === 'aplicada' || res.resultado === 'duplicada') confirmadas.push(res.op_id);
      else if (res.codigo === 'REINTENTAR') cola.programarReintento([res.op_id], res.motivo);
      else if (res.codigo === 'DESACTUALIZADO') {
        // "La última escritura gana": el servidor tenía un cambio más nuevo; nos quedamos con el suyo.
        confirmadas.push(res.op_id);
        resultado.desactualizadas += 1;
        resultado.completo = true;
      } else {
        const op = ops.find((o) => o.op_id === res.op_id);
        cola.marcarRechazada(res.op_id, { codigo: res.codigo, mensaje: res.motivo });
        resultado.rechazadas.push({ op_id: res.op_id, descripcion: op?.descripcion, codigo: res.codigo, mensaje: res.motivo });
        // Volvemos a descargar todo para que la pantalla muestre lo que realmente quedó en el servidor.
        resultado.completo = true;
      }
    }
    cola.quitar(confirmadas);
    resultado.enviadas += confirmadas.length;
  }
}

async function ciclo({ completo = false } = {}) {
  const sesion = load('session', null);
  if (!sesion?.userId || !hayConexion()) return { omitido: true };
  cambiar({ sincronizando: true });
  const resultado = { enviadas: 0, rechazadas: [], desactualizadas: 0, completo, error: null };
  try {
    await enviarCola(sesion.userId, resultado);
    const cursor = load('syncCursor', null);
    const desde = !resultado.completo && cursor?.usuarioId === sesion.userId ? cursor.hasta : null;
    const datos = await api('GET', `/sync/pull${desde ? `?desde=${encodeURIComponent(desde)}` : ''}`);
    aplicarCambios(datos, sesion.userId);
    save('syncCursor', { hasta: datos.hasta, usuarioId: sesion.userId });
    cambiar({ sincronizando: false, ultimo: Date.now(), error: resultado.error });
  } catch (e) {
    cambiar({ sincronizando: false, error: e });
    if (e.status === 401) avisar({ tipo: 'sesion-vencida' });
    resultado.error = e;
  }
  avisar({ tipo: 'resultado', ...resultado });
  return resultado;
}

let enCurso = null;
let otraVez = null;
/** Sincroniza ahora (si ya hay una en curso, encadena otra al terminar). */
export function sincronizar(opciones = {}) {
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

let temporizador = null;
/** Pide una sincronización en un momento (agrupa varios cambios seguidos). */
export function programarSync(ms = 300) {
  clearTimeout(temporizador);
  temporizador = setTimeout(() => sincronizar(), ms);
}

/** Arranca los disparadores: volver la señal, volver a la app y cada 30 s (avisos de emergencia). */
export function iniciarMotor() {
  if (typeof window === 'undefined') return () => {};
  const alVolver = () => hayConexion() && sincronizar();
  const alVisible = () => document.visibilityState === 'visible' && alVolver();
  window.addEventListener('online', alVolver);
  document.addEventListener('visibilitychange', alVisible);
  const intervalo = setInterval(() => document.visibilityState !== 'hidden' && alVolver(), 30000);
  return () => {
    window.removeEventListener('online', alVolver);
    document.removeEventListener('visibilitychange', alVisible);
    clearInterval(intervalo);
  };
}
