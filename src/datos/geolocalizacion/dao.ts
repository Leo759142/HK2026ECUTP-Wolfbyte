/* ==================================================================
 *  AYNI · DAO de caché local para geolocalización (IndexedDB/OPFS)
 *  ---------------------------------------------------------------------
 *  Persistencia de la última ubicación detectada para evitar re-detección
 *  en cada sesión. Se usa como capa de almacenamiento en la arquitectura
 *  hexagonal: DAO + repositorios + servicio.
 *  ================================================================== */

const DB_NAME = 'ayni_geolocalizacion';
const STORE = 'ubicaciones';
const KEY = 'ultima_ubicacion';

interface LocalCache {
  departamento: string;
  coordenadas: { lat: number; lng: number };
  fuente: 'gps' | 'ip' | 'osm' | 'offline';
  timestamp: number;
  confianza: 'alta' | 'media' | 'baja';
}

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function obtenerDesdeCache(): Promise<LocalCache | null> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const req = store.get(KEY);
    await new Promise((resolve) => { req.onsuccess = resolve; });
    return req.result ?? null;
  } catch (err) {
    console.warn('[AYNI] DAO: no se pudo leer caché', err);
    return null;
  }
}

export async function guardarEnCache(ubicacion: LocalCache): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    await new Promise((resolve, reject) => {
      const req = store.put({ key: KEY, ...ubicacion });
      req.onsuccess = resolve;
      req.onerror = reject;
    });
  } catch (err) {
    console.warn('[AYNI] DAO: no se pudo guardar caché', err);
  }
}

export async function limpiarCache(): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    await new Promise((resolve, reject) => {
      const req = store.clear();
      req.onsuccess = resolve;
      req.onerror = reject;
    });
  } catch (err) {
    console.warn('[AYNI] DAO: no se pudo limpiar caché', err);
  }
}/* ==================================================================
 *  AYNI · DAO de caché local para geolocalización (IndexedDB/OPFS)
 *  ---------------------------------------------------------------------
 *  Persistencia de la última ubicación detectada para evitar re-detección
 *  en cada sesión. Se usa como capa de almacenamiento en la arquitectura
 *  hexagonal: DAO + repositorios + servicio.
 *  ================================================================== */
const DB_NAME = 'ayni_geolocalizacion';
const STORE = 'ubicaciones';
const KEY = 'ultima_ubicacion';
interface LocalCache {
  departamento: string;
  coordenadas: { lat: number; lng: number };
  fuente: 'gps' | 'ip' | 'osm' | 'offline';
  timestamp: number;
  confianza: 'alta' | 'media' | 'baja';
}
function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function obtenerDesdeCache(): Promise<LocalCache | null> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const req = store.get(KEY);
    await new Promise((resolve) => { req.onsuccess = resolve; });
    return req.result ?? null;
  } catch (err) {
    console.warn('[AYNI] DAO: no se pudo leer caché', err);
    return null;
  }
}
export async function guardarEnCache(ubicacion: LocalCache): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    await new Promise((resolve, reject) => {
      const req = store.put({ key: KEY, ...ubicacion });
      req.onsuccess = resolve;
      req.onerror = reject;
    });
  } catch (err) {
    console.warn('[AYNI] DAO: no se pudo guardar caché', err);
  }
}
export async function limpiarCache(): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    await new Promise((resolve, reject) => {
      const req = store.clear();
      req.onsuccess = resolve;
      req.onerror = reject;
    });
  } catch (err) {
    console.warn('[AYNI] DAO: no se pudo limpiar caché', err);
  }
}

