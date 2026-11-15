/* Estado global de AYNI (migrado de AppContext.jsx a runes de Svelte 5):
 * sesión, navegación entre pantallas, idioma, conexión, emergencia activa y avisos. */
import { db, load, save, subscribe } from './storage.js';
import { RESERVA_MS } from './data.js';

const COLECCIONES = ['users', 'sectors', 'services', 'recommendations', 'contacts', 'favors', 'reports', 'moderation', 'emergencies', 'needs', 'groups', 'outbox'];

/** Copia reactiva de las colecciones de localStorage (equivale a useCollection). */
export const datos = $state(Object.fromEntries(COLECCIONES.map((c) => [c, db.list(c)])));

const AJUSTES_INICIALES = { lang: 'es', largeText: false, forceOffline: false };

class App {
  session = $state(load('session', null));
  // Se mezcla con los valores iniciales: un ajuste guardado por una versión anterior nunca queda sin idioma.
  settings = $state({ ...AJUSTES_INICIALES, ...load('settings', {}) });
  stack = $state([{ name: load('session', null)?.userId ? 'inicio' : 'portada', params: {} }]);
  toast = $state(null);
  netOnline = $state(typeof navigator === 'undefined' ? true : navigator.onLine);
  /** GET /api/v1/estado: { demo, ... } */
  servidor = $state({ demo: false });

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
    return u ? (datos.sectors.find((s) => s.id === u.sectorId) ?? null) : null;
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
    return u ? (datos.emergencies.find((e) => e.sectorId === u.sectorId && e.status === 'activa') ?? null) : null;
  }

  /* ---------- Navegación simple por pila ---------- */
  go = (name, params = {}) => {
    this.stack = [...this.stack, { name, params }];
    scrollTop();
  };
  replace = (name, params = {}) => {
    this.stack = [...this.stack.slice(0, -1), { name, params }];
    scrollTop();
  };
  back = () => {
    if (this.stack.length > 1) this.stack = this.stack.slice(0, -1);
  };
  reset = (name, params = {}) => {
    this.stack = [{ name, params }];
    scrollTop();
  };

  /* ---------- Avisos breves ---------- */
  #timer;
  notify = (message) => {
    this.toast = message;
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => (this.toast = null), 3200);
  };

  setSettings = (next) => {
    const valor = typeof next === 'function' ? next(this.settings) : next;
    save('settings', valor);
  };

  startSession = (userId, screen = 'inicio') => {
    save('session', { userId });
    this.reset(screen);
  };
  /** Solo la parte local; acciones.cerrarSesion avisa al servidor. */
  endSession = () => {
    save('session', null);
    this.reset('portada');
  };
}

const scrollTop = () => typeof window !== 'undefined' && window.scrollTo?.(0, 0);

export const app = new App();

/* ---------- Mantener el estado al día con localStorage (también entre pestañas) ---------- */
subscribe((key) => {
  const todas = key === '*';
  for (const c of COLECCIONES) if (todas || key === c) datos[c] = db.list(c);
  if (todas || key === 'session') app.session = load('session', null);
  if (todas || key === 'settings') app.settings = { ...AJUSTES_INICIALES, ...load('settings', {}) };
});

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => (app.netOnline = true));
  window.addEventListener('offline', () => (app.netOnline = false));

  // Un favor reservado que no se concreta en 1 hora vuelve a estar disponible (el servidor hace lo mismo).
  const liberar = () => {
    const ahora = Date.now();
    for (const f of db.list('favors')) {
      if (f.status === 'reservado' && ahora - (f.reservedAt ?? 0) > RESERVA_MS) {
        db.update('favors', f.id, { status: 'disponible', takerId: null, reservedAt: null, ownerConfirmed: false, takerConfirmed: false });
      }
    }
  };
  liberar();
  setInterval(liberar, 30 * 1000);
}
