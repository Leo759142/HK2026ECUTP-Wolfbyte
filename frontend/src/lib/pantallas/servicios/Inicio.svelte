<!-- 2.1 Inicio (en modo emergencia muestra InicioEmergencia) -->
<script>
  import { app } from '../../estado.svelte.js';
  import { t } from '$lib/i18n';
  import { CATEGORIAS } from '../../data.js';
  import { inicial } from '../../util.js';
  import Avatar from '../../ui/Avatar.svelte';
  import ConnectionStatus from '../../ui/ConnectionStatus.svelte';
  import Icon from '../../ui/Icon.svelte';
  import LangChip from '../../ui/LangChip.svelte';
  import Screen from '../../ui/Screen.svelte';
  import InicioEmergencia from '../emergencia/InicioEmergencia.svelte';
  import AtendioSheet from './AtendioSheet.svelte';
  import ServiceCard from './ServiceCard.svelte';
  import { ORDEN, serviciosVisibles } from './comun.js';

  let query = $state('');
  const top = $derived(serviciosVisibles(app.user).filter((s) => s.ownerId !== app.user?.id).sort(ORDEN.recomendados).slice(0, 3));
</script>

{#if app.activeEmergency}
  <InicioEmergencia />
{:else}
  <Screen>
    <div class="flex items-center justify-between gap-2">
      <div class="min-w-0">
        <div class="truncate text-sm font-bold text-gris">📍 {app.sector?.name} · Mz. {app.user?.manzana}</div>
        <h1 class="text-2xl font-black leading-tight">{$t('hola')}, {app.user?.firstName}! 👋</h1>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <LangChip />
        <button type="button" aria-label="Mi perfil" onclick={() => app.reset('perfil')}>
          <Avatar letter={inicial(app.user)} class="h-12 w-12 bg-ambar text-lg" />
        </button>
      </div>
    </div>
    <ConnectionStatus />
    <form
      role="search"
      onsubmit={(e) => {
        e.preventDefault();
        app.go('resultados', { query });
      }}
      class="flex min-h-[54px] items-center gap-2 rounded-2xl border-2 border-linea bg-white px-4 focus-within:border-morado">
      <span aria-hidden="true"><Icon name="fa-magnifying-glass" /></span>
      <input aria-label={$t('buscar')} bind:value={query} placeholder={$t('buscar')} class="min-h-[50px] flex-1 bg-transparent text-base font-semibold placeholder:text-gris focus:outline-none" />
    </form>
    <button type="button" onclick={() => app.go('reportarEmergencia')} class="flex min-h-[52px] items-center gap-2 rounded-2xl border-2 border-dashed border-rojo bg-white px-4 text-left text-sm font-extrabold text-rojo">
      ⚠️ {$t('reportar')}
    </button>

    <h2 class="text-lg font-black">{$t('oficios')}</h2>
    <div class="grid grid-cols-2 gap-2.5 min-[380px]:grid-cols-4">
      {#each CATEGORIAS.slice(0, 7) as c (c.id)}
        <button type="button" onclick={() => app.go('resultados', { category: c.id })} class="flex min-h-[80px] flex-col items-center justify-center gap-1 rounded-2xl border border-linea bg-white text-[11px] font-extrabold leading-tight">
          <span class="text-2xl" aria-hidden="true">{c.emoji}</span>{c.label}
        </button>
      {/each}
      <button type="button" onclick={() => app.go('resultados', {})} class="flex min-h-[80px] flex-col items-center justify-center gap-1 rounded-2xl border border-linea bg-white text-[11px] font-extrabold">
        <span class="text-2xl" aria-hidden="true"><Icon name="fa-plus" /></span>Ver todo
      </button>
    </div>

    <div class="flex items-center justify-between">
      <h2 class="text-lg font-black">{$t('recomendados')}</h2>
      <button type="button" onclick={() => app.reset('mapa')} class="min-h-[48px] px-1 text-sm font-extrabold text-petroleo">Ver mapa</button>
    </div>
    {#each top as s (s.id)}
      <ServiceCard {s} onclick={() => app.go('servicio', { id: s.id })} />
    {/each}

    <button type="button" onclick={() => app.go('publicar', { kind: 'servicio' })} class="flex items-center gap-3 rounded-[20px] border-2 border-morado bg-morado-claro p-4 text-left">
      <span class="text-3xl" aria-hidden="true"><Icon name="fa-screwdriver-wrench" /></span>
      <span class="flex-1">
        <span class="block font-black text-morado-osc">¿Tienes un oficio o vendes algo?</span>
        <span class="block text-sm font-semibold text-morado-osc">Ofrécelo a tus vecinos en 3 clics.</span>
      </span>
    </button>
    <AtendioSheet />
  </Screen>
{/if}
