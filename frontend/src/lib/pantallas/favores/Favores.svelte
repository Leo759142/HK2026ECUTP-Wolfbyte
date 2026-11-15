<!-- 2.3 Cadena de Favores (muro) -->
<script>
  import { app, datos } from '../../estado.svelte.js';
  import { t } from '$lib/i18n';
  import ConnectionStatus from '../../ui/ConnectionStatus.svelte';
  import EmptyState from '../../ui/EmptyState.svelte';
  import H1 from '../../ui/H1.svelte';
  import Screen from '../../ui/Screen.svelte';
  import Sub from '../../ui/Sub.svelte';
  import FavorCard from './FavorCard.svelte';

  const FILTROS = [
    { id: 'todo', label: 'Todo' },
    { id: 'pido', label: 'Pido' },
    { id: 'presto', label: 'Presto' },
    { id: 'regalo', label: 'Regalo' },
    { id: 'intercambio', label: 'Intercambio' },
  ];
  let filtro = $state('todo');
  const visibles = $derived(
    datos.favors
      .filter((f) => !f.hidden && (f.status === 'disponible' || f.status === 'reservado' || (f.status === 'pendiente' && f.ownerId === app.user.id)))
      .filter((f) => filtro === 'todo' || f.tipo === filtro)
      .sort((a, b) => b.createdAt - a.createdAt)
  );
</script>

<Screen class="gap-3">
  <div>
    <H1>{$t('favores')} 🤝</H1>
    <Sub>{$t('favoresSub')}</Sub>
  </div>
  <ConnectionStatus />
  <div class="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1" role="tablist">
    {#each FILTROS as f (f.id)}
      <button type="button" role="tab" aria-selected={filtro === f.id} onclick={() => (filtro = f.id)} class="min-h-[44px] shrink-0 rounded-full border px-4 text-sm font-extrabold {filtro === f.id ? 'border-tinta bg-tinta text-white' : 'border-linea bg-white'}">{f.label}</button>
    {/each}
  </div>
  {#each visibles as f (f.id)}
    <FavorCard {f} onclick={() => app.go('favor', { id: f.id })} />
  {/each}
  {#if visibles.length === 0}
    <EmptyState emoji="🌱" title="Todavía no hay publicaciones aquí">Sé el primero: toca el botón + para pedir u ofrecer algo.</EmptyState>
  {/if}
</Screen>
