/* ==================================================================
 *  Cola de sincronización (outbox) guardada en el celular.
 *  Cada cambio hecho en la app se guarda aquí con un op_id (UUID) que se
 *  conserva en todos los reintentos: el servidor lo aplica UNA sola vez.
 *  Estados: pendiente → (enviada y confirmada: sale de la cola)
 *                     → rechazada (queda para que el vecino la vea y decida)
 *  Nunca se borra nada automáticamente salvo lo que el servidor confirmó.
 * ================================================================== */
import { load, save, uid } from '../storage.js';

const CLAVE = 'outbox';

export const leerCola = () => load(CLAVE, []);
const guardar = (ops) => save(CLAVE, ops);

/**
 * Agrega una operación.
 * @param {{entidad: string, operacion: 'crear'|'actualizar'|'eliminar', payload: object, usuarioId: string, ref?: {col: string, id: string}, descripcion?: string}} op
 */
export function encolar(op) {
  const item = {
    op_id: uid(),
    entidad: op.entidad,
    operacion: op.operacion,
    payload: op.payload,
    usuarioId: op.usuarioId,
    ref: op.ref ?? null,
    descripcion: op.descripcion ?? '',
    creado_en: new Date().toISOString(),
    estado: 'pendiente',
    intentos: 0,
    siguienteIntento: 0,
    error: null,
  };
  guardar([...leerCola(), item]);
  return item;
}

/** Operaciones listas para enviar (del usuario actual, en orden, respetando la espera entre reintentos). */
export function listasParaEnviar(usuarioId, ahora = Date.now(), max = 100) {
  return leerCola()
    .filter((o) => o.usuarioId === usuarioId && o.estado === 'pendiente' && (o.siguienteIntento ?? 0) <= ahora)
    .slice(0, max);
}

export function quitar(opIds) {
  const set = new Set(opIds);
  if (!set.size) return;
  guardar(leerCola().filter((o) => !set.has(o.op_id)));
}

export function marcarRechazada(opId, error) {
  guardar(leerCola().map((o) => (o.op_id === opId ? { ...o, estado: 'rechazada', error } : o)));
}

/** Espera antes de reintentar: 2 s, 4 s, 8 s… hasta 2 minutos. */
export const espera = (intentos) => Math.min(120000, 2000 * 2 ** Math.min(intentos, 6));

export function programarReintento(opIds, motivo, ahora = Date.now()) {
  const set = new Set(opIds);
  guardar(
    leerCola().map((o) => {
      if (!set.has(o.op_id)) return o;
      const intentos = (o.intentos ?? 0) + 1;
      return { ...o, intentos, siguienteIntento: ahora + espera(intentos), error: motivo ? { codigo: 'REINTENTAR', mensaje: motivo } : o.error };
    })
  );
}

/** El vecino decide qué hacer con una operación rechazada: reintentarla o descartarla. */
export function reintentar(opId) {
  guardar(leerCola().map((o) => (o.op_id === opId ? { ...o, estado: 'pendiente', siguienteIntento: 0, error: null } : o)));
}

/** ids de registros locales que tienen cambios sin confirmar (el servidor aún no los conoce o no los aplicó). */
export function idsConCambiosLocales(usuarioId) {
  const ids = new Set();
  for (const o of leerCola()) if (o.usuarioId === usuarioId && o.ref?.id) ids.add(`${o.ref.col}:${o.ref.id}`);
  return ids;
}

export function resumenCola(usuarioId) {
  const mias = leerCola().filter((o) => o.usuarioId === usuarioId);
  return {
    pendientes: mias.filter((o) => o.estado === 'pendiente').length,
    rechazadas: mias.filter((o) => o.estado === 'rechazada'),
  };
}
