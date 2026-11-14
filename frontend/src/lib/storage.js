/* ==================================================================
 *  AYNI · Capa de persistencia en localStorage (CRUD genérico)
 *  ---------------------------------------------------------------------
 *  Cada "colección" es un arreglo JSON guardado bajo la clave
 *  `ayni:v1:<coleccion>`. Las pantallas nunca tocan localStorage
 *  directamente: usan `db` para escribir y `useCollection` / `useStored`
 *  para leer, y se vuelven a pintar solas cuando algo cambia
 *  (también entre pestañas abiertas del mismo navegador).
 *
 *  La sincronización con el backend (cola + motor) usa estas mismas colecciones:
 *  ver sync/cola.js y sync/motor.js.
 * ===================================================================== */

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
  });
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

/** UUID v4. Usa getRandomValues: funciona también fuera de HTTPS (celular por la red local). */
export function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch {
      /* contexto no seguro */
    }
  }
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

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
