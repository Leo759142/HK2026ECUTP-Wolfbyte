<!-- 4.6 Alerta a todos los vecinos (overlay) -->
<script>
  import { app } from '../../estado.svelte.js';
  import { emergenciaById } from '../../data.js';
  import { hace } from '../../util.js';
  import { acusarEmergencia } from '../../acciones.js';
  import Btn from '../../ui/Btn.svelte';
  import Circle from '../../ui/Circle.svelte';
  import FullOverlay from '../../ui/FullOverlay.svelte';

  let { e } = $props();
  const tipo = $derived(emergenciaById(e.tipo));
  function responder(respuesta, destino) {
    acusarEmergencia(e, { respuesta });
    app.reset('inicio');
    if (destino) app.go(destino);
  }
</script>

<FullOverlay class="bg-rojo text-white">
  <div class="flex flex-1 flex-col gap-4 px-6 pb-10 pt-8 text-center">
    <div class="flex-1"></div>
    <Circle emoji="🚨" class="bg-white" />
    <h1 class="text-3xl font-black">EMERGENCIA EN TU SECTOR</h1>
    <p class="text-xl font-black">{tipo.emoji} {tipo.label} · Mz. {e.manzana} y alrededores</p>
    {#if e.texto}<p class="font-semibold opacity-90">“{e.texto}”</p>{/if}
    <p class="text-sm font-semibold opacity-85">Confirmada por un Guardián {hace(e.confirmedAt)}</p>
    <div class="flex-1"></div>
    <Btn variant="blanco" class="!text-tinta" onclick={() => responder('bien')}>✅ Estoy bien</Btn>
    <Btn variant="blanco" class="!text-rojo-osc" onclick={() => responder('ayuda', 'pedirAyuda')}>🆘 Necesito ayuda</Btn>
    <Btn variant="bordeBlanco" onclick={() => responder('visto')}>Ver qué pasa</Btn>
  </div>
</FullOverlay>
