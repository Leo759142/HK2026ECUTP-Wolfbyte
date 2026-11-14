<!-- 3.1 Inicio en modo emergencia -->
<script>
  import { app, datos } from '../../estado.svelte.js';
  import { RECURSOS, emergenciaById } from '../../data.js';
  import { hace } from '../../util.js';
  import NumerosEmergencia from '../../ui/NumerosEmergencia.svelte';
  import Screen from '../../ui/Screen.svelte';

  const e = $derived(app.activeEmergency);
  const tipo = $derived(emergenciaById(e.tipo));
  const miPedido = $derived(datos.needs.find((n) => n.emergencyId === e.id && n.ownerId === app.user.id && n.status !== 'resuelto'));
  const abiertos = $derived(datos.needs.filter((n) => n.emergencyId === e.id && n.status === 'abierto').length);
</script>

<div class="flex flex-1 flex-col bg-rojo-fondo">
  <div class="flex flex-col gap-1 bg-rojo px-5 pb-4 pt-4 text-white">
    <div class="text-xl font-black">🚨 Emergencia activa: {tipo.label}</div>
    <div class="text-sm font-semibold opacity-90">Confirmada por un Guardián {hace(e.confirmedAt)} · Mz. {e.manzana} y alrededores</div>
  </div>
  <Screen>
    {#if miPedido}
      <button type="button" onclick={() => app.go('miPedido', { id: miPedido.id })} class="rounded-2xl border-2 border-rojo bg-white p-3 text-left text-sm font-extrabold text-rojo-osc">
        {miPedido.status === 'en_camino' ? '🙋 Alguien va en camino a ayudarte · Ver' : '⏳ Tu pedido de ayuda está publicado · Ver'}
      </button>
    {/if}
    <div class="grid grid-cols-2 gap-3">
      <button type="button" onclick={() => app.go('pedirAyuda')} class="flex h-32 flex-col items-center justify-center gap-1 rounded-3xl bg-rojo text-lg font-black text-white">
        <span class="text-4xl" aria-hidden="true">🆘</span>Necesito ayuda
      </button>
      <button type="button" onclick={() => app.go('mapa')} class="flex h-32 flex-col items-center justify-center gap-1 rounded-3xl bg-petroleo text-lg font-black text-white">
        <span class="text-4xl" aria-hidden="true">💪</span>Puedo ayudar
        {#if abiertos > 0}<span class="text-xs font-bold opacity-90">{abiertos} vecino(s) esperan</span>{/if}
      </button>
    </div>
    <h2 class="text-lg font-black">Recursos cerca</h2>
    <div class="grid grid-cols-3 gap-2.5">
      {#each RECURSOS as r (r.id)}
        {@const n = datos.groups.filter((g) => g.recurso === r.id).length}
        <button type="button" onclick={() => app.go('grupos')} class="flex min-h-[80px] flex-col items-center justify-center rounded-2xl border border-linea bg-white p-2 text-xs font-extrabold">
          <span class="text-2xl" aria-hidden="true">{r.emoji}</span>{r.label}
          <span class="font-semibold text-gris">{n ? `${n} punto(s)` : 'Sin datos'}</span>
        </button>
      {/each}
    </div>
    <h2 class="text-lg font-black">Números de emergencia</h2>
    <NumerosEmergencia />
  </Screen>
</div>
