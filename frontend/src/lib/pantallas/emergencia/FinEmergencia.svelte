<!-- 4.11 Fin de la emergencia (overlay) -->
<script>
  import { app, datos } from '../../estado.svelte.js';
  import { emergenciaById } from '../../data.js';
  import { acusarEmergencia } from '../../acciones.js';
  import Btn from '../../ui/Btn.svelte';
  import Circle from '../../ui/Circle.svelte';
  import FullOverlay from '../../ui/FullOverlay.svelte';
  import H1 from '../../ui/H1.svelte';
  import Screen from '../../ui/Screen.svelte';
  import Sub from '../../ui/Sub.svelte';

  let { e } = $props();
  const ayudaron = $derived(new Set(datos.needs.filter((n) => n.emergencyId === e.id).map((n) => n.helperId).filter(Boolean)).size);
  function cerrar() {
    acusarEmergencia(e, { finVisto: true });
    app.reset('inicio');
  }
</script>

<FullOverlay>
  <Screen class="text-center">
    <div class="flex-1"></div>
    <Circle emoji="🕊️" class="bg-petroleo-claro" />
    <H1>La emergencia terminó</H1>
    <Sub>Un Guardián marcó la {emergenciaById(e.tipo).label.toLowerCase()} como atendida. AYNI vuelve a la normalidad.</Sub>
    <div class="rounded-[20px] bg-morado-claro p-4 text-morado-osc">
      <div class="text-lg font-black">💜 {ayudaron} vecino(s) ayudaron</div>
      <div class="text-sm font-bold">Hoy por ti, mañana por mí.</div>
    </div>
    <div class="flex-1"></div>
    <Btn onclick={cerrar}>Volver al inicio</Btn>
  </Screen>
</FullOverlay>
