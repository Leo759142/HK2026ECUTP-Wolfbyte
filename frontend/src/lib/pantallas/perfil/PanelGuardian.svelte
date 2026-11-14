<!-- 3.3 / 4.10 / 6.8 Panel del Guardián (el servidor valida que seas Guardián del sector) -->
<script>
  import { app, datos } from '../../estado.svelte.js';
  import { emergenciaById } from '../../data.js';
  import { hace, nombreVisible } from '../../util.js';
  import { cerrarEmergencia, confirmarEmergencia, descartarEmergencia, moderar } from '../../acciones.js';
  import Btn from '../../ui/Btn.svelte';
  import Chip from '../../ui/Chip.svelte';
  import EmptyState from '../../ui/EmptyState.svelte';
  import Header from '../../ui/Header.svelte';
  import Screen from '../../ui/Screen.svelte';
  import TextArea from '../../ui/TextArea.svelte';

  /** El panel permite descartar sin escribir motivo; la base exige uno (mismo texto que usa el servidor). */
  const MOTIVO_POR_DEFECTO = 'Un Guardián revisó el reporte y no activó la emergencia.';
  let descartando = $state(null);
  let motivo = $state('');

  const pendientes = $derived(datos.emergencies.filter((e) => e.sectorId === app.user.sectorId && e.status === 'pendiente'));
  const activa = $derived(datos.emergencies.find((e) => e.sectorId === app.user.sectorId && e.status === 'activa'));
  const pedidos = $derived(activa ? datos.needs.filter((n) => n.emergencyId === activa.id) : []);
  const sinAtender = $derived(pedidos.filter((n) => n.status === 'abierto').length);
  const ayudantes = $derived(new Set(pedidos.map((n) => n.helperId).filter(Boolean)).size);
  // Cuántos respondieron "Estoy bien" lo calcula el servidor (resumen); sin señal se usa lo que hay en el celular.
  const aSalvo = $derived(activa ? (activa.resumen?.a_salvo ?? Object.values(activa.acks ?? {}).filter((a) => a === 'bien').length) : 0);

  function confirmar(e) {
    confirmarEmergencia(e);
    app.notify('🚨 Modo emergencia activado. Tus vecinos fueron avisados.');
  }
  function descartar(e) {
    descartarEmergencia(e, motivo.trim() || MOTIVO_POR_DEFECTO);
    descartando = null;
    motivo = '';
    app.notify('Reporte descartado. Avisamos al vecino.');
  }
  function cerrar(e) {
    cerrarEmergencia(e);
    app.notify('🕊️ Emergencia marcada como atendida');
  }
  function decidir(g, aprobar) {
    moderar(g, aprobar);
    app.notify(aprobar ? 'Publicación aprobada y visible otra vez' : 'Publicación ocultada');
  }
</script>

{#if !app.isGuardian}
  <Screen>
    <Header />
    <EmptyState emoji="🛡️" title="Solo para Guardianes" />
  </Screen>
{:else}
  <Screen class="gap-3">
    <Header title="Mi perfil" />
    <div class="flex items-center gap-3 rounded-[20px] border-2 border-morado bg-morado-claro p-3.5">
      <span class="text-3xl" aria-hidden="true">🛡️</span>
      <div>
        <div class="font-black">Panel del Guardián</div>
        <div class="text-sm font-semibold text-gris">{app.sector?.name}</div>
      </div>
    </div>

    <h2 class="text-lg font-black">Emergencias por confirmar</h2>
    {#if pendientes.length === 0}<div class="rounded-2xl border border-linea bg-white p-4 font-semibold text-gris">🙌 No hay reportes pendientes</div>{/if}
    {#each pendientes as e (e.id)}
      {@const tipo = emergenciaById(e.tipo)}
      {@const autor = app.users.find((u) => u.id === e.reporterId)}
      <div class="flex flex-col gap-2.5 rounded-3xl border-2 border-rojo bg-white p-4">
        <div class="flex items-center justify-between">
          <Chip class="bg-rojo-claro text-rojo-osc">{tipo.emoji} {tipo.label.toUpperCase()}</Chip>
          <span class="text-xs font-semibold text-gris">{hace(e.createdAt)}</span>
        </div>
        {#if e.texto}<p class="text-lg font-extrabold">“{e.texto}”</p>{/if}
        {#if e.foto}<img src={e.foto} alt="Foto del reporte" class="max-h-48 rounded-2xl object-cover" />{/if}
        <div class="text-sm font-semibold text-gris">Reportado por {autor?.id === app.user.id ? 'ti' : nombreVisible(autor)} · Mz. {e.manzana}</div>
        {#if descartando === e.id}
          <TextArea bind:value={motivo} placeholder="Motivo (opcional). Ej: Los bomberos ya controlaron la acequia." />
          <Btn variant="borde" onclick={() => descartar(e)}>Descartar reporte</Btn>
          <button type="button" class="min-h-[44px] text-sm font-bold text-gris" onclick={() => (descartando = null)}>Cancelar</button>
        {:else}
          <p class="text-sm font-semibold">Si confirmas, se activará el modo emergencia para todo {app.sector?.name}.</p>
          <Btn variant="rojo" onclick={() => confirmar(e)}>✓ Confirmar emergencia</Btn>
          <Btn variant="borde" onclick={() => (descartando = e.id)}>Descartar</Btn>
        {/if}
      </div>
    {/each}

    {#if activa}
      <h2 class="text-lg font-black text-rojo-osc">🚨 Emergencia activa · {emergenciaById(activa.tipo).label}</h2>
      <div class="grid grid-cols-3 gap-2 text-center">
        {#each [[pedidos.length, 'pedidos de ayuda'], [pedidos.length - sinAtender, 'atendidos'], [ayudantes + aSalvo, 'vecinos a salvo o ayudando']] as [n, l] (l)}
          <div class="rounded-2xl border border-linea bg-white p-2">
            <div class="text-2xl font-black">{n}</div>
            <div class="text-[11px] font-bold leading-tight text-gris">{l}</div>
          </div>
        {/each}
      </div>
      {#if sinAtender > 0}<div class="rounded-2xl border border-ambar bg-ambar-claro p-3 text-sm font-bold">⚠️ Aún hay {sinAtender} pedido(s) sin atender. Revisa el mapa antes de cerrar.</div>{/if}
      <Btn onclick={() => cerrar(activa)}>✓ Marcar emergencia como atendida</Btn>
      <Btn variant="borde" onclick={() => app.go('mapa')}>Ver mapa de ayuda</Btn>
    {/if}

    <h2 class="text-lg font-black">Publicaciones reportadas ({datos.moderation.length})</h2>
    {#if datos.moderation.length === 0}<div class="rounded-2xl border border-linea bg-white p-4 font-semibold text-gris">Todo en orden 👌</div>{/if}
    {#each datos.moderation as g (g.id)}
      <div class="flex flex-col gap-2 rounded-[20px] border-2 border-ambar bg-white p-4">
        <div class="flex items-center justify-between gap-2">
          <Chip class="bg-ambar-claro text-tinta">{g.hidden ? 'Oculta automáticamente' : 'En revisión'}</Chip>
          <span class="text-xs font-bold text-gris">{g.total} reporte(s)</span>
        </div>
        <p class="font-bold">“{g.descripcion ?? g.titulo}”</p>
        <p class="text-sm font-semibold text-gris">Motivo más común: {g.motivoPrincipal}</p>
        <div class="flex gap-2">
          <Btn variant="borde" class="!min-h-[48px] !text-base" onclick={() => decidir(g, true)}>Aprobar</Btn>
          <Btn class="!min-h-[48px] !text-base" onclick={() => decidir(g, false)}>Ocultar</Btn>
        </div>
      </div>
    {/each}
  </Screen>
{/if}
