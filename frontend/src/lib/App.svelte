<!-- Shell de AYNI (migrado de App.jsx): pantalla actual según la pila de navegación, barra inferior, avisos y toast. -->
<script>
  import { app, datos } from './estado.svelte.js';
  import { DIAS_PARA_GUARDIAN } from './data.js';
  import { diasEnAyni } from './util.js';
  import Portada from './pantallas/acceso/Portada.svelte';
  import Tutorial from './pantallas/acceso/Tutorial.svelte';
  import Telefono from './pantallas/acceso/Telefono.svelte';
  import Codigo from './pantallas/acceso/Codigo.svelte';
  import Nombre from './pantallas/acceso/Nombre.svelte';
  import Ubicacion from './pantallas/acceso/Ubicacion.svelte';
  import Zona from './pantallas/acceso/Zona.svelte';
  import CrearSector from './pantallas/acceso/CrearSector.svelte';
  import PrimerGuardian from './pantallas/acceso/PrimerGuardian.svelte';
  import Bienvenida from './pantallas/acceso/Bienvenida.svelte';
  import Inicio from './pantallas/servicios/Inicio.svelte';
  import Resultados from './pantallas/servicios/Resultados.svelte';
  import PerfilServicio from './pantallas/servicios/PerfilServicio.svelte';
  import DarVistoBueno from './pantallas/servicios/DarVistoBueno.svelte';
  import Gracias from './pantallas/servicios/Gracias.svelte';
  import Favores from './pantallas/favores/Favores.svelte';
  import DetalleFavor from './pantallas/favores/DetalleFavor.svelte';
  import MisPublicaciones from './pantallas/favores/MisPublicaciones.svelte';
  import FavorCerrado from './pantallas/favores/FavorCerrado.svelte';
  import Publicar from './pantallas/publicar/Publicar.svelte';
  import Mapa from './pantallas/Mapa.svelte';
  import ApiDocs from './pantallas/ApiDocs.svelte';
  import PendientesSync from './pantallas/PendientesSync.svelte';
  import Perfil from './pantallas/perfil/Perfil.svelte';
  import Ajustes from './pantallas/perfil/Ajustes.svelte';
  import PanelGuardian from './pantallas/perfil/PanelGuardian.svelte';
  import InvitacionGuardian from './pantallas/perfil/InvitacionGuardian.svelte';
  import InvitacionSheet from './pantallas/perfil/InvitacionSheet.svelte';
  import GuardianAceptado from './pantallas/perfil/GuardianAceptado.svelte';
  import Reportar from './pantallas/perfil/Reportar.svelte';
  import ReportarEmergencia from './pantallas/emergencia/ReportarEmergencia.svelte';
  import ReporteEnviado from './pantallas/emergencia/ReporteEnviado.svelte';
  import ResultadoReporte from './pantallas/emergencia/ResultadoReporte.svelte';
  import AlertaEmergencia from './pantallas/emergencia/AlertaEmergencia.svelte';
  import FinEmergencia from './pantallas/emergencia/FinEmergencia.svelte';
  import PedirAyuda from './pantallas/emergencia/PedirAyuda.svelte';
  import MiPedido from './pantallas/emergencia/MiPedido.svelte';
  import Grupos from './pantallas/emergencia/Grupos.svelte';
  import LogoApp from './ui/LogoApp.svelte';

  const SCREENS = {
    portada: Portada, tutorial: Tutorial, telefono: Telefono, codigo: Codigo, nombre: Nombre, ubicacion: Ubicacion,
    zona: Zona, crearSector: CrearSector, primerGuardian: PrimerGuardian, bienvenida: Bienvenida,
    inicio: Inicio, resultados: Resultados, servicio: PerfilServicio, vistoBueno: DarVistoBueno, gracias: Gracias,
    favores: Favores, favor: DetalleFavor, misPublicaciones: MisPublicaciones, favorCerrado: FavorCerrado,
    publicar: Publicar, mapa: Mapa, apiDocs: ApiDocs, pendientesSync: PendientesSync,
    perfil: Perfil, ajustes: Ajustes, panelGuardian: PanelGuardian, invitacionGuardian: InvitacionGuardian,
    guardianAceptado: GuardianAceptado, reportar: Reportar,
    reportarEmergencia: ReportarEmergencia, reporteEnviado: ReporteEnviado, pedirAyuda: PedirAyuda, miPedido: MiPedido, grupos: Grupos,
  };
  const PUBLICAS = new Set(['portada', 'tutorial', 'telefono', 'codigo', 'nombre', 'ubicacion', 'zona', 'crearSector', 'ajustes', 'apiDocs']);
  const SIN_AVISOS = new Set([...PUBLICAS, 'primerGuardian', 'bienvenida']);
  const CON_BARRA = new Set(['inicio', 'favores', 'mapa', 'perfil', 'grupos', 'misPublicaciones', 'panelGuardian']);

  const nombre = $derived(!app.user && !PUBLICAS.has(app.route.name) ? 'portada' : app.route.name);
  const Pantalla = $derived(SCREENS[nombre] ?? Inicio);
  const conBarra = $derived(Boolean(app.user) && CON_BARRA.has(nombre));
  const clave = $derived(`${app.stack.length}-${nombre}`);

  const items = $derived(
    app.activeEmergency
      ? [['inicio', '🚨', 'nav.ahora'], ['mapa', '🗺️', 'nav.mapa'], ['+'], ['grupos', '👥', 'nav.grupos'], ['perfil', '👤', 'nav.yo']]
      : [['inicio', '🏠', 'nav.inicio'], ['favores', '🤝', 'nav.favores'], ['+'], ['mapa', '🗺️', 'nav.mapa'], ['perfil', '👤', 'nav.yo']]
  );

  /* Avisos a pantalla completa, en orden de prioridad. */
  const aviso = $derived.by(() => {
    const u = app.user;
    if (!u || SIN_AVISOS.has(nombre)) return null;
    const em = datos.emergencies;
    const respuesta = em.find((e) => e.reporterId === u.id && !e.reporterSeen && (e.status === 'activa' || e.status === 'descartada'));
    if (respuesta) return { tipo: 'resultado', e: respuesta };
    const fin = em.find((e) => e.sectorId === u.sectorId && e.status === 'atendida' && !e.endSeen?.[u.id] && Date.now() - e.endedAt < 48 * 3600 * 1000);
    if (fin) return { tipo: 'fin', e: fin };
    const alerta = em.find((e) => e.sectorId === u.sectorId && e.status === 'activa' && !e.acks?.[u.id]);
    if (alerta) return { tipo: 'alerta', e: alerta };
    if (!app.isGuardian && !u.inviteAnswered && diasEnAyni(u) >= DIAS_PARA_GUARDIAN) return { tipo: 'invitacion' };
    return null;
  });
</script>

<div class="relative mx-auto flex min-h-dvh max-w-[430px] flex-col bg-crema shadow-[0_0_40px_rgba(15,76,92,.12)]">
  <!-- Marca de AYNI: un solo lugar, visible en todas las pantallas. -->
  <header class="flex items-center px-5 pt-3 text-tinta">
    <LogoApp size={32} conNombre />
  </header>
  <main class="flex flex-1 flex-col {conBarra ? 'pb-28' : ''}">
    {#key clave}
      <Pantalla {...app.route.params} />
    {/key}
  </main>

  {#if conBarra}
    <nav class="fixed inset-x-0 bottom-0 z-30 mx-auto flex h-[84px] max-w-[430px] items-start justify-around border-t border-linea bg-white px-2 pt-2" aria-label="Navegación principal">
      {#each items as [name, icon, label] (name)}
        {#if name === '+'}
          <button
            type="button"
            aria-label={app.activeEmergency ? 'Pedir ayuda' : app.t('nav.publicar')}
            onclick={() => app.go(app.activeEmergency ? 'pedirAyuda' : 'publicar')}
            class="-mt-6 flex h-[60px] w-[60px] items-center justify-center rounded-full text-4xl font-black text-white shadow-lg {app.activeEmergency ? 'bg-rojo' : 'bg-morado'}">+</button>
        {:else}
          <button
            type="button"
            onclick={() => app.reset(name)}
            aria-current={nombre === name ? 'page' : undefined}
            class="flex min-h-[56px] w-16 flex-col items-center justify-center gap-0.5 text-xs font-extrabold {nombre === name ? (app.activeEmergency ? 'text-rojo' : 'text-petroleo') : 'text-gris'}">
            <span class="text-[22px]" aria-hidden="true">{icon}</span>
            {app.t(label)}
          </button>
        {/if}
      {/each}
    </nav>
  {/if}

  {#if aviso?.tipo === 'resultado'}<ResultadoReporte e={aviso.e} />
  {:else if aviso?.tipo === 'fin'}<FinEmergencia e={aviso.e} />
  {:else if aviso?.tipo === 'alerta'}<AlertaEmergencia e={aviso.e} />
  {:else if aviso?.tipo === 'invitacion'}<InvitacionSheet />{/if}

  {#if app.toast}
    <div role="status" class="fixed inset-x-0 top-4 z-[60] mx-auto w-fit max-w-[90%] rounded-2xl bg-tinta px-4 py-3 text-center text-sm font-bold text-white shadow-lg">{app.toast}</div>
  {/if}
</div>
