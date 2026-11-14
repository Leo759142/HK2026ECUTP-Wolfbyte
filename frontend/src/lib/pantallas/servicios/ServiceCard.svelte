<script>
  import { catById, etiquetaById } from '../../data.js';
  import { cuadrasTxt, nombreVisible } from '../../util.js';
  import Card from '../../ui/Card.svelte';
  import Chip from '../../ui/Chip.svelte';
  import ChipPendiente from '../../ui/ChipPendiente.svelte';
  let { s, onclick } = $props();
  const cat = $derived(catById(s.categoria));
</script>

<Card {onclick}>
  <div class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-ambar-claro text-3xl" aria-hidden="true">
    {#if s.foto}<img src={s.foto} alt="" class="h-full w-full object-cover" />{:else}{cat.emoji}{/if}
  </div>
  <div class="flex min-w-0 flex-1 flex-col gap-1">
    <div class="text-base font-black leading-tight">{nombreVisible(s.owner, s.showFullName)} · {s.titulo}</div>
    <div class="text-sm font-semibold text-gris">📍 {cuadrasTxt(s.dist)} · {s.horario}</div>
    <div class="flex flex-wrap gap-1">
      {#if s.stats.count > 0}
        <Chip class="bg-morado-claro text-morado-osc">👍 {s.stats.count}{s.stats.topTags.slice(0, 2).map((t) => ` · ${etiquetaById(t.id)?.label}`).join('')}</Chip>
      {:else}
        <Chip class="bg-linea text-gris">Nuevo en AYNI</Chip>
      {/if}
      {#if s.clase === 'producto'}<Chip class="bg-ambar-claro text-tinta">🛍️ Producto</Chip>{/if}
      {#if s.status === 'pendiente'}<ChipPendiente />{/if}
      {#if s.status === 'pausado'}<Chip class="bg-linea text-gris">⏸️ Pausado</Chip>{/if}
    </div>
  </div>
</Card>
