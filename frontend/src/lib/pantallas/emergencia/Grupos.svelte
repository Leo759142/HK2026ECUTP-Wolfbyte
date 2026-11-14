<!-- 4.9 Grupos y servicios de apoyo -->
<script>
  import { app, datos } from '../../estado.svelte.js';
  import { emergenciaById } from '../../data.js';
  import { abrirEnlace, whatsappLink } from '../../util.js';
  import EmergencyBanner from '../../ui/EmergencyBanner.svelte';
  import H1 from '../../ui/H1.svelte';
  import Screen from '../../ui/Screen.svelte';

  const e = $derived(app.activeEmergency);
</script>

<div class="flex flex-1 flex-col bg-rojo-fondo">
  {#if e}<EmergencyBanner emergencia={e} tipo={emergenciaById(e.tipo)} />{/if}
  <Screen class="gap-3">
    <H1>Grupos y servicios de apoyo</H1>
    {#each datos.groups as g (g.id)}
      <div class="flex items-center gap-3 rounded-[20px] border border-linea bg-white p-3.5">
        <span class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-rojo-claro text-3xl" aria-hidden="true">{g.emoji}</span>
        <div class="min-w-0 flex-1">
          <div class="font-black leading-tight">{g.name}</div>
          <div class="text-sm font-semibold text-gris">{g.meta}</div>
        </div>
        {#if g.contacto.tipo === 'tel'}
          <a href="tel:{g.contacto.valor}" class="flex min-h-[48px] items-center rounded-full bg-rojo px-4 text-sm font-black text-white">📞 {g.contacto.valor}</a>
        {:else}
          <button type="button" onclick={() => abrirEnlace(whatsappLink(g.contacto.valor, 'Hola, te escribo desde AYNI por la emergencia.'))} class="min-h-[48px] rounded-full bg-rojo px-4 text-sm font-black text-white">💬 Escribir</button>
        {/if}
      </div>
    {/each}
  </Screen>
</div>
