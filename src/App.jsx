import { useApp } from './AppContext';
import { useCollection } from './storage';
import { DIAS_PARA_GUARDIAN } from './data';
import { diasEnAyni } from './util';
import { Bienvenida, Codigo, CrearSector, Nombre, Portada, PrimerGuardian, Telefono, Tutorial, Ubicacion, Zona } from './screens/Acceso';
import { DarVistoBueno, Gracias, Inicio, PerfilServicio, Resultados } from './screens/Servicios';
import { DetalleFavor, FavorCerrado, Favores, MisPublicaciones } from './screens/Favores';
import { Publicar } from './screens/Publicar';
import { Ajustes, GuardianAceptado, InvitacionGuardian, InvitacionSheet, PanelGuardian, Perfil, Reportar } from './screens/Perfil';
import { AlertaEmergencia, FinEmergencia, Grupos, MiPedido, PedirAyuda, ReportarEmergencia, ReporteEnviado, ResultadoReporte } from './screens/Emergencia';
import { Mapa } from './screens/Mapa';
import { ApiDocs } from './screens/ApiDocs';

export const SCREENS = {
  // Acceso y registro
  portada: Portada,
  tutorial: Tutorial,
  telefono: Telefono,
  codigo: Codigo,
  nombre: Nombre,
  ubicacion: Ubicacion,
  zona: Zona,
  crearSector: CrearSector,
  primerGuardian: PrimerGuardian,
  bienvenida: Bienvenida,
  // Uso diario
  inicio: Inicio,
  resultados: Resultados,
  servicio: PerfilServicio,
  vistoBueno: DarVistoBueno,
  gracias: Gracias,
  favores: Favores,
  favor: DetalleFavor,
  misPublicaciones: MisPublicaciones,
  favorCerrado: FavorCerrado,
  publicar: Publicar,
  mapa: Mapa,
  apiDocs: ApiDocs,
  // Perfil y Guardianes
  perfil: Perfil,
  ajustes: Ajustes,
  panelGuardian: PanelGuardian,
  invitacionGuardian: InvitacionGuardian,
  guardianAceptado: GuardianAceptado,
  reportar: Reportar,
  // Emergencia
  reportarEmergencia: ReportarEmergencia,
  reporteEnviado: ReporteEnviado,
  pedirAyuda: PedirAyuda,
  miPedido: MiPedido,
  grupos: Grupos,
};

const PUBLICAS = new Set(['portada', 'tutorial', 'telefono', 'codigo', 'nombre', 'ubicacion', 'zona', 'crearSector', 'ajustes']);
const SIN_AVISOS = new Set([...PUBLICAS, 'primerGuardian', 'bienvenida']);
const CON_BARRA = new Set(['inicio', 'favores', 'mapa', 'perfil', 'grupos', 'misPublicaciones', 'panelGuardian']);

function BottomNav() {
  const { route, reset, go, t, activeEmergency } = useApp();
  const items = activeEmergency
    ? [['inicio', '🚨', 'nav.ahora'], ['mapa', '🗺️', 'nav.mapa'], ['+'], ['grupos', '👥', 'nav.grupos'], ['perfil', '👤', 'nav.yo']]
    : [['inicio', '🏠', 'nav.inicio'], ['favores', '🤝', 'nav.favores'], ['+'], ['mapa', '🗺️', 'nav.mapa'], ['perfil', '👤', 'nav.yo']];
  const activo = activeEmergency ? 'text-rojo' : 'text-petroleo';
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto flex h-[84px] max-w-[430px] items-start justify-around border-t border-linea bg-white px-2 pt-2" aria-label="Navegación principal">
      {items.map(([name, icon, label]) =>
        name === '+' ? (
          <button
            key="+"
            type="button"
            aria-label={activeEmergency ? 'Pedir ayuda' : t('nav.publicar')}
            onClick={() => go(activeEmergency ? 'pedirAyuda' : 'publicar')}
            className={`-mt-6 flex h-[60px] w-[60px] items-center justify-center rounded-full text-4xl font-black text-white shadow-lg ${activeEmergency ? 'bg-rojo' : 'bg-morado'}`}
          >
            +
          </button>
        ) : (
          <button key={name} type="button" onClick={() => reset(name)} aria-current={route.name === name ? 'page' : undefined} className={`flex min-h-[56px] w-16 flex-col items-center justify-center gap-0.5 text-xs font-extrabold ${route.name === name ? activo : 'text-gris'}`}>
            <span className="text-[22px]" aria-hidden="true">{icon}</span>
            {t(label)}
          </button>
        )
      )}
    </nav>
  );
}

/** Avisos a pantalla completa, en orden de prioridad. */
function Avisos() {
  const { user, isGuardian, route } = useApp();
  const emergencias = useCollection('emergencies');
  if (!user || SIN_AVISOS.has(route.name)) return null;

  const respuesta = emergencias.find((e) => e.reporterId === user.id && !e.reporterSeen && (e.status === 'activa' || e.status === 'descartada'));
  if (respuesta) return <ResultadoReporte e={respuesta} />;

  const fin = emergencias.find((e) => e.sectorId === user.sectorId && e.status === 'atendida' && !e.endSeen?.[user.id] && Date.now() - e.endedAt < 48 * 3600 * 1000);
  if (fin) return <FinEmergencia e={fin} />;

  const alerta = emergencias.find((e) => e.sectorId === user.sectorId && e.status === 'activa' && !e.acks?.[user.id]);
  if (alerta) return <AlertaEmergencia e={alerta} />;

  if (!isGuardian && !user.inviteAnswered && diasEnAyni(user) >= DIAS_PARA_GUARDIAN) return <InvitacionSheet />;
  return null;
}

function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <div role="status" className="fixed inset-x-0 top-4 z-[60] mx-auto w-fit max-w-[90%] rounded-2xl bg-tinta px-4 py-3 text-center text-sm font-bold text-white shadow-lg">
      {toast}
    </div>
  );
}

export default function App() {
  const { route, user, stack } = useApp();
  let name = route.name;
  if (!user && !PUBLICAS.has(name)) name = 'portada';
  const Pantalla = SCREENS[name] ?? Inicio;
  const conBarra = Boolean(user) && CON_BARRA.has(name);

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-[430px] flex-col bg-crema shadow-[0_0_40px_rgba(15,76,92,.12)]">
      <main className={`flex flex-1 flex-col ${conBarra ? 'pb-28' : ''}`}>
        <Pantalla key={`${stack.length}-${name}`} {...route.params} />
      </main>
      {conBarra && <BottomNav />}
      <Avisos />
      <Toast />
    </div>
  );
}
