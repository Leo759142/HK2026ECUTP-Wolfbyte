<!-- 5.1 Resultados de búsqueda -->
<script>
  import { app } from '../../estado.svelte.js';
  import { catById } from '../../data.js';
  import { normalizar } from '../../util.js';
  import Btn from '../../ui/Btn.svelte';
  import EmptyState from '../../ui/EmptyState.svelte';
  import H1 from '../../ui/H1.svelte';
  import Header from '../../ui/Header.svelte';
  import Screen from '../../ui/Screen.svelte';
  import ServiceCard from './ServiceCard.svelte';
  import { ORDEN, serviciosVisibles } from './comun.js';

  let props = $props();
  let { category, query = '' } = props;
  let orden = $state('recomendados');
  let q = $state(query);
  const cat = $derived(category ? catById(category) : null);
  const lista = $derived.by(() => {
    const term = normalizar(q);
    return serviciosVisibles(app.user)
      .filter((s) => !cat || s.categoria === cat.id)
      .filter((s) => !term || [s.titulo, s.descripcion, catById(s.categoria).label, s.owner?.firstName].some((v) => normalizar(v).includes(term)))
      .sort(ORDEN[orden]);
  });
</script>

<Screen class="gap-3">
  <Header title="Resultados" />
  <H1>{cat ? `${cat.emoji} ${cat.label} cerca de ti` : 'Servicios y productos del barrio'}</H1>
  <input aria-label="Buscar" bind:value={q} placeholder="🔍 Buscar por oficio o nombre" class="min-h-[52px] rounded-2xl border-2 border-linea bg-white px-4 font-semibold focus:border-morado focus:outline-none" />
  <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Ordenar">
    {#each [['recomendados', '⭐ Recomendados cerca'], ['cerca', '📍 Más cercanos'], ['vistos', '👍 Más recomendados']] as [id, label] (id)}
      <button type="button" role="radio" aria-checked={orden === id} onclick={() => (orden = id)} class="min-h-[44px] rounded-full border-2 px-3 text-xs font-extrabold {orden === id ? 'border-petroleo bg-petroleo text-white' : 'border-linea bg-white text-tinta'}">{label}</button>
    {/each}
  </div>
  <div class="text-sm font-semibold text-gris">{lista.length} resultado(s) en tu sector</div>
  {#each lista as s (s.id)}
    <ServiceCard {s} onclick={() => app.go('servicio', { id: s.id })} />
  {/each}
  {#if lista.length === 0}
    <EmptyState emoji="🔎" title="Aún no hay nadie con ese oficio">
      Pídelo en la Cadena de Favores: quizá un vecino puede ayudarte.
      <Btn variant="acento" class="mt-3" onclick={() => app.go('publicar', { kind: 'pido' })}>Pedir ayuda a mis vecinos</Btn>
    </EmptyState>
  {/if}
</Screen>
