// @ts-nocheck

/* ==================================================================
 *  AYNI · Capa de persistencia en localStorage (CRUD genérico)
 *  ---------------------------------------------------------------------
 *  Cada "colección" es un arreglo JSON guardado bajo la clave
 *  `ayni:v1:<coleccion>`. Las pantallas nunca tocan localStorage
 *  directamente: usan `db` para escribir y `useCollection` / `useStored`
 *  para leer, y se vuelven a pintar solas cuando algo cambia
 *  (también entre pestañas abiertas del mismo navegador).
 *
 *  Para pasar a un backend real en el futuro basta con reemplazar
 *  este archivo: el resto de la app no cambia.
 * ===================================================================== */
import { useCallback, useEffect, useState } from 'react';

const PREFIX = 'ayni:v1:';
const listeners = new Set();

function storageAvailable() {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

/** Avisa a los componentes suscritos que una clave cambió. */
function emit(key) {
  listeners.forEach((fn) => fn(key));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Sincroniza cambios hechos en otra pestaña del mismo navegador.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key && event.key.startsWith(PREFIX)) emit(event.key.slice(PREFIX.length));
    if (event.key === null) emit('*');
  );
}

export function load(key, fallback) {
  if (!storageAvailable()) return fallback;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  if (storageAvailable()) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (error) {
      // Normalmente: cuota llena por fotos muy pesadas.
      console.warn('[AYNI] No se pudo guardar en localStorage:', error);
    }
  }
  emit(key);
}

export const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

/** CRUD genérico sobre colecciones. */
export const db = {
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
    const item = { id: uid(), createdAt: now, updatedAt: now, ...data };
    save(collection, [item, ...load(collection, [])]);
    return item;
  },

  /** UPDATE: `patch` puede ser un objeto o una función (item) => cambios. */
  update(collection, id, patch) {
    let updated = null;
    const list = load(collection, []).map((item) => {
      if (item.id !== id) return item;
      const changes = typeof patch === 'function' ? patch(item) : patch;
      updated = { ...item, ...changes, updatedAt: Date.now() };
      return updated;
    });
    save(collection, list);
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
    if (storageAvailable()) {
      Object.keys(localStorage)
        .filter((key) => key.startsWith(PREFIX))
        .forEach((key) => localStorage.removeItem(key));
    }
    emit('*');
  },
};

/** Hook: lee una colección y se actualiza cuando cambia. */
export function useCollection(collection) {
  const [items, setItems] = useState(() => db.list(collection));
  useEffect(() => {
    setItems(db.list(collection));
    return subscribe((key) => {
      if (key === collection || key === '*') setItems(db.list(collection));
    });
  }, [collection]);
  return items;
}

/** Hook: un valor suelto persistido (sesión, ajustes, borrador de registro). */
export function useStored(key, initial) {
  const [value, setValue] = useState(() => load(key, initial));
  useEffect(
    () =>
      subscribe((changed) => {
        if (changed === key || changed === '*') setValue(load(key, initial));
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]
  );
  const set = useCallback(
    (next) => {
      const current = load(key, initial);
      save(key, typeof next === 'function' ? next(current) : next);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]
  );
  return [value, set];
}