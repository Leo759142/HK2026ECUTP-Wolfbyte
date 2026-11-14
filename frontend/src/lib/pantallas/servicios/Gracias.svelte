<!-- 5.4 Gracias por recomendar -->
<script>
  import { app } from '../../estado.svelte.js';
  import Btn from '../../ui/Btn.svelte';
  import Chip from '../../ui/Chip.svelte';
  import Circle from '../../ui/Circle.svelte';
  import H1 from '../../ui/H1.svelte';
  import Screen from '../../ui/Screen.svelte';
  import Sub from '../../ui/Sub.svelte';
  import { serviciosVisibles } from './comun.js';

  let { id } = $props();
  const s = $derived(serviciosVisibles(app.user).find((x) => x.id === id));
</script>

<Screen class="text-center">
  <div class="flex-1"></div>
  <Circle emoji="💜" class="bg-morado-claro" />
  <H1>¡Gracias por recomendar!</H1>
  <Sub>Tu Visto Bueno ayuda a tus vecinos a encontrar gente de confianza cerca de casa.</Sub>
  {#if s}
    <div><Chip class="bg-morado-claro px-4 py-2 text-sm text-morado-osc">👍 Ahora {s.stats.count} vecinos recomiendan a {s.owner.firstName}</Chip></div>
  {/if}
  <div class="flex-1"></div>
  <Btn onclick={() => app.reset('inicio')}>Volver al inicio</Btn>
</Screen>
