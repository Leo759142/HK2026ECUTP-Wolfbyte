<!-- 6.3 Mis publicaciones (editar, pausar, liberar, eliminar) -->
<script>
  import { app, datos } from '../../estado.svelte.js';
  import { nombreVisible } from '../../util.js';
  import { confirmarFavor, demoConfirmarOtro, eliminarPublicacion, liberarFavor, pausarServicio } from '../../acciones.js';
  import ConnectionStatus from '../../ui/ConnectionStatus.svelte';
  import EmptyState from '../../ui/EmptyState.svelte';
  import H1 from '../../ui/H1.svelte';
  import Header from '../../ui/Header.svelte';
  import LinkBtn from '../../ui/LinkBtn.svelte';
  import Screen from '../../ui/Screen.svelte';
  import Segmented from '../../ui/Segmented.svelte';
  import ServiceCard from '../servicios/ServiceCard.svelte';
  import { conDetalle } from '../servicios/comun.js';
  import FavorCard from './FavorCard.svelte';

  let tab = $state('activas');
  const u = $derived(app.user);
  const misServicios = $derived(datos.services.filter((s) => s.ownerId === u.id && s.status !== 'oculto').map((s) => conDetalle(s, u)));
  const activas = $derived(datos.favors.filter((f) => f.ownerId === u.id && (f.status === 'disponible' || f.status === 'pendiente')));
  const reservadas = $derived(datos.favors.filter((f) => f.status === 'reservado' && (f.ownerId === u.id || f.takerId === u.id)));
  const cerradas = $derived(datos.favors.filter((f) => f.status === 'cerrado' && (f.ownerId === u.id || f.takerId === u.id)).sort((a, b) => b.closedAt - a.closedAt));
  const btn = 'min-h-[44px] flex-1 rounded-xl border-2 border-linea bg-white px-2 text-xs font-extrabold';

  function eliminar(col, id) {
    if (typeof window !== 'undefined' && !window.confirm('¿Eliminar esta publicación? No se puede deshacer.')) return;
    eliminarPublicacion(col, id);
    app.notify('Publicación eliminada');
  }
  const otroDe = (f) => app.users.find((x) => x.id === (f.ownerId === u.id ? f.takerId : f.ownerId));
  const ladoDe = (f) => (f.ownerId === u.id ? 'owner' : 'taker');
  async function simularOtro(f) {
    if (await demoConfirmarOtro(f)) app.go('favorCerrado', { id: f.id });
  }
</script>

{#snippet acciones(f)}
  {#if f.status === 'reservado'}
    {@const otro = otroDe(f)}
    {@const lado = ladoDe(f)}
    {@const yoConfirme = lado === 'owner' ? f.ownerConfirmed : f.takerConfirmed}
    <div class="flex flex-col gap-2 border-t border-linea pt-2">
      <div class="text-sm font-bold">
        {lado === 'owner' ? `Reservado por ${nombreVisible(otro)}` : `Lo reservaste a ${nombreVisible(otro)}`}. {yoConfirme ? `Esperando a ${otro?.firstName}.` : '¿Ya se concretó?'}
      </div>
      <div class="flex gap-2">
        {#if !yoConfirme}
          <button type="button" class="{btn} border-petroleo bg-petroleo text-white" onclick={() => (confirmarFavor(f, lado) ? app.go('favorCerrado', { id: f.id }) : app.notify(`Falta que ${otro?.firstName} confirme`))}>✅ Listo</button>
        {/if}
        {#if lado === 'owner'}<button type="button" class={btn} onclick={() => liberarFavor(f)}>Liberar</button>{/if}
      </div>
      {#if yoConfirme && app.servidor.demo}
        <LinkBtn class="!min-h-[36px] !text-xs !text-gris" onclick={() => simularOtro(f)}>🧪 Demo: simular que {otro?.firstName} también confirmó</LinkBtn>
      {/if}
    </div>
  {:else if f.status !== 'cerrado'}
    <div class="flex gap-2 border-t border-linea pt-2">
      <button type="button" class={btn} onclick={() => app.go('publicar', { editCol: 'favors', editId: f.id })}>✏️ Editar</button>
      <button type="button" class={btn} onclick={() => eliminar('favors', f.id)}>🗑️ Eliminar</button>
    </div>
  {/if}
{/snippet}

<Screen class="gap-3">
  <Header title="Mi perfil" />
  <ConnectionStatus />
  <H1>Mis publicaciones</H1>
  <Segmented
    options={[
      { id: 'activas', label: `Activas (${activas.length + misServicios.length})` },
      { id: 'reservadas', label: `Reservadas (${reservadas.length})` },
      { id: 'cerradas', label: 'Cerradas' },
    ]}
    value={tab}
    onChange={(v) => (tab = v)} />

  {#if tab === 'activas'}
    {#if misServicios.length > 0}<h2 class="text-sm font-extrabold text-gris">Mis servicios y productos</h2>{/if}
    {#each misServicios as s (s.id)}
      <div class="flex flex-col gap-2">
        <ServiceCard {s} onclick={() => app.go('servicio', { id: s.id })} />
        <div class="flex gap-2">
          <button type="button" class={btn} onclick={() => app.go('publicar', { editCol: 'services', editId: s.id })}>✏️ Editar</button>
          <button type="button" class={btn} onclick={() => pausarServicio(s)}>{s.status === 'pausado' ? '▶️ Activar' : '⏸️ Pausar'}</button>
          <button type="button" class={btn} onclick={() => eliminar('services', s.id)}>🗑️ Eliminar</button>
        </div>
      </div>
    {/each}
    {#if activas.length > 0}<h2 class="text-sm font-extrabold text-gris">Mis favores</h2>{/if}
    {#each activas as f (f.id)}
      <FavorCard {f} onclick={() => app.go('favor', { id: f.id })}>{@render acciones(f)}</FavorCard>
    {/each}
    {#if activas.length + misServicios.length === 0}<EmptyState emoji="📭" title="No tienes publicaciones activas">Toca + para ofrecer o pedir algo.</EmptyState>{/if}
  {:else if tab === 'reservadas'}
    {#each reservadas as f (f.id)}
      <FavorCard {f} onclick={() => app.go('favor', { id: f.id })}>{@render acciones(f)}</FavorCard>
    {:else}
      <EmptyState emoji="⏳" title="Nada reservado por ahora" />
    {/each}
  {:else}
    {#each cerradas as f (f.id)}
      <FavorCard {f} onclick={() => app.go('favor', { id: f.id })} />
    {:else}
      <EmptyState emoji="🤝" title="Aún no cierras favores" />
    {/each}
  {/if}
</Screen>
