/* Estado global de AYNI: sesión, navegación entre pantallas, idioma,
 * conexión (online/offline), emergencia activa y avisos (toasts). */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { db, useCollection, useStored } from './storage';
import { translate } from './i18n';
import { RESERVA_MS } from './data';

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

const AJUSTES_INICIALES = { lang: 'es', largeText: false, forceOffline: false };

export function AppProvider({ children, initialRoute }) {
  const [session, setSession] = useStored('session', null);
  const [settings, setSettings] = useStored('settings', AJUSTES_INICIALES);
  const users = useCollection('users');
  const sectors = useCollection('sectors');
  const emergencies = useCollection('emergencies');

  const user = users.find((u) => u.id === session?.userId) ?? null;
  const sector = user ? sectors.find((s) => s.id === user.sectorId) ?? null : null;
  const isGuardian = Boolean(user && sector?.guardianIds?.includes(user.id));

  /* ---------- Navegación simple por pila (sin dependencias extra) ---------- */
  const [stack, setStack] = useState(() => [initialRoute ?? { name: session?.userId ? 'inicio' : 'portada', params: {} }]);
  const route = stack[stack.length - 1];
  const scrollTop = () => typeof window !== 'undefined' && window.scrollTo?.(0, 0);
  const go = useCallback((name, params = {}) => {
    setStack((s) => [...s, { name, params }]);
    scrollTop();
  }, []);
  const replace = useCallback((name, params = {}) => {
    setStack((s) => [...s.slice(0, -1), { name, params }]);
    scrollTop();
  }, []);
  const back = useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)), []);
  const reset = useCallback((name, params = {}) => {
    setStack([{ name, params }]);
    scrollTop();
  }, []);

  /* ---------- Avisos breves ---------- */
  const [toast, setToast] = useState(null);
  const toastTimer = useRef();
  const notify = useCallback((message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  /* ---------- Conexión: real (navigator.onLine) o simulada desde Mi perfil ---------- */
  const [netOnline, setNetOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  useEffect(() => {
    const on = () => setNetOnline(true);
    const off = () => setNetOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  const online = netOnline && !settings.forceOffline;

  // Al volver la señal, lo "pendiente de enviar" se publica.
  useEffect(() => {
    if (!online || !user) return;
    let enviados = 0;
    for (const col of ['favors', 'services']) {
      for (const item of db.list(col)) {
        if (item.ownerId === user.id && item.status === 'pendiente') {
          db.update(col, item.id, { status: 'disponible', syncedAt: Date.now() });
          enviados += 1;
        }
      }
    }
    if (enviados) notify(`✅ Volvió la señal: se publicaron ${enviados} pendiente(s)`);
  }, [online, user?.id, notify]); // eslint-disable-line react-hooks/exhaustive-deps

  // Un favor reservado que no se concreta en 1 hora vuelve a estar disponible.
  useEffect(() => {
    const liberar = () => {
      const ahora = Date.now();
      for (const f of db.list('favors')) {
        if (f.status === 'reservado' && ahora - (f.reservedAt ?? 0) > RESERVA_MS) {
          db.update('favors', f.id, { status: 'disponible', takerId: null, reservedAt: null, ownerConfirmed: false, takerConfirmed: false });
        }
      }
    };
    liberar();
    const timer = setInterval(liberar, 30 * 1000);
    return () => clearInterval(timer);
  }, []);

  // Letra grande e idioma del documento.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('letra-grande', Boolean(settings.largeText));
    document.documentElement.lang = settings.lang;
  }, [settings.largeText, settings.lang]);

  const activeEmergency = user ? emergencies.find((e) => e.sectorId === user.sectorId && e.status === 'activa') ?? null : null;

  const t = useCallback((key) => translate(settings.lang, key), [settings.lang]);

  const startSession = useCallback(
    (userId, screen = 'inicio') => {
      setSession({ userId });
      reset(screen);
    },
    [setSession, reset]
  );
  const logout = useCallback(() => {
    setSession(null);
    reset('portada');
  }, [setSession, reset]);
  const updateUser = useCallback((patch) => user && db.update('users', user.id, patch), [user]);

  const value = useMemo(
    () => ({
      user, sector, isGuardian, users, sectors,
      route, stack, go, replace, back, reset,
      settings, setSettings, t,
      online, activeEmergency,
      toast, notify,
      startSession, logout, updateUser,
    }),
    [user, sector, isGuardian, users, sectors, route, stack, go, replace, back, reset, settings, setSettings, t, online, activeEmergency, toast, notify, startSession, logout, updateUser]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
