

    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Timeout en IP');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export { IPRepository };

// Guardado de caché local (IndexedDB)
async function guardarCache(lat: number, lng: number, fuente: string): Promise<void> {
  try {
    const dbName = 'ayni_geolocalizacion';
    const req = indexedDB.open(dbName, 1);
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction('ubicaciones', 'readwrite');
      const store = tx.objectStore('ubicaciones');
      store.put({
        key: Date.now().toString(),
        lat,
        lng,
        fuente,
        timestamp: Date.now()
      });
    };
  } catch (e) {
    console.warn('[AYNI] Fallo guardado caché:', e);
  }
}

// Cargar caché
export async function obtenerCaché(): Promise<{lat: number, lng: number, fuente: string} | null> {
  try {
    const dbName = 'ayni_geolocalizacion';
    const req = indexedDB.open(dbName, 1);
    req.onsuccess = () => {
      const db = req.result;
      if (db.objectStoreNames.contains('ubicaciones')) {
        const tx = db.transaction('ubicaciones', 'readonly');
        const store = tx.objectStore('ubicaciones');
        const req = store.get('ultima_ubicacion');
        req.onsuccess = () => {
          return req.result ?? null;
        };
      }
    };
  } catch (e) {
    console.warn('[AYNI] Fallo lectura caché:', e);
    return null;
  }
}

// Actualizar caché
export async function guardarCaché(lat: number, lng: number, fuente: string): Promise<void> {
  try {
    const dbName = 'ayni_geolocalizacion';
    const req = indexedDB.open(dbName, 1);
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction('ubicaciones', 'readwrite');
      const store = tx.objectStore('ubicaciones');
      store.put({
        key: 'ultima_ubicacion',
        lat,
        lng,
        fuente,
        timestamp: Date.now()
      });
    };
  } catch (e) {
    console.warn('[AYNI] Fallo guardado caché:', e);
  }
}

