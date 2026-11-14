<!-- 2.2 Perfil de servicio -->
<script>
  import { app, datos } from '../../estado.svelte.js';
  import { catById, etiquetaById } from '../../data.js';
  import { cuadrasTxt, nombreVisible } from '../../util.js';
  import { contactarServicio } from '../../acciones.js';
  import Btn from '../../ui/Btn.svelte';
  import Chip from '../../ui/Chip.svelte';
  import EmptyState from '../../ui/EmptyState.svelte';
  import H1 from '../../ui/H1.svelte';
  import Header from '../../ui/Header.svelte';
  import Icon from '../../ui/Icon.svelte';
  import LinkBtn from '../../ui/LinkBtn.svelte';
  import Screen from '../../ui/Screen.svelte';
  import Sub from '../../ui/Sub.svelte';
  import { serviciosVisibles } from './comun.js';

  let { id } = $props();
  const s = $derived(serviciosVisibles(app.user).find((x) => x.id === id));
  const cat = $derived(s ? catById(s.categoria) : null);
  const mine = $derived(s?.ownerId === app.user.id);
  const atendido = $derived(datos.contacts.some((c) => c.serviceId === id && c.userId === app.user.id && c.attended));
  const yaDio = $derived(datos.recommendations.some((r) => r.serviceId === id && r.userId === app.user.id));

  function darVistoBueno() {
    if (yaDio) return app.notify('Ya le diste tu Visto Bueno 💜');
    if (!atendido) return app.notify('Podrás recomendarlo cuando te haya atendido. Primero escríbele por WhatsApp.');
    return app.go('vistoBueno', { id });
  }
</script>

{#if !s}
  <Screen>
    <Header />
    <EmptyState emoji="🙈" title="Esta publicación ya no está disponible" />
  </Screen>
{:else}
  <div class="flex flex-1 flex-col">
    <div class="relative rounded-b-[28px] bg-petroleo px-5 pb-14 pt-3">
      <Header light>
        {#snippet right()}
          {#if !mine}<LinkBtn class="!w-auto px-2 !text-white/90" onclick={() => app.go('reportar', { col: 'services', id })}><Icon name="fa-flag" /> Reportar</LinkBtn>{/if}
        {/snippet}
      </Header>
      <div class="absolute -bottom-12 left-5 flex h-24 w-24 items-center justify-center overflow-hidden rounded-[28px] border-4 border-white bg-ambar text-5xl" aria-hidden="true">
        {#if s.foto}<img src={s.foto} alt="" class="h-full w-full object-cover" />{:else}{cat.emoji}{/if}
      </div>
    </div>
    <Screen class="pt-16">
      <div>
        <H1>{nombreVisible(s.owner, s.showFullName)}</H1>
        <Sub>{s.titulo} · {cat.label} · 📍 {cuadrasTxt(s.dist)}</Sub>
      </div>
      <div><Chip class="bg-morado-claro px-4 py-2 text-sm text-morado-osc">✅ Visto Bueno Vecinal · {s.stats.count} vecinos</Chip></div>
      <p class="text-[15px] font-semibold">{s.descripcion}</p>
      <div class="grid grid-cols-2 gap-2.5">
        <div class="rounded-2xl border border-linea bg-white p-3 text-center">
          <div class="text-lg font-black">{s.precio || 'A tratar'}</div>
          <div class="text-xs font-bold text-gris">{s.clase === 'producto' ? 'precio' : 'desde'}</div>
        </div>
        <div class="rounded-2xl border border-linea bg-white p-3 text-center">
          <div class="text-base font-black leading-tight">{s.horario}</div>
          <div class="text-xs font-bold text-gris">horario</div>
        </div>
      </div>
      {#if s.stats.topTags.length > 0}
        <div class="flex flex-wrap gap-2">
          {#each s.stats.topTags as tag (tag.id)}
            {@const e = etiquetaById(tag.id)}
            {#if e}<Chip class="bg-white text-tinta ring-1 ring-linea">{e.emoji} {e.label} · {tag.count}</Chip>{/if}
          {/each}
        </div>
      {/if}
      {#if s.stats.comentarios.length > 0}
        <h2 class="text-base font-black">Lo que dicen tus vecinos</h2>
        {#each s.stats.comentarios.slice(0, 5) as r (r.id)}
          {@const autor = datos.users.find((u) => u.id === r.userId)}
          <div class="rounded-2xl border border-linea bg-white p-3 text-sm"><b>{nombreVisible(autor)}, Mz. {autor?.manzana}</b> · “{r.comment}”</div>
        {/each}
      {/if}
      <div class="flex-1"></div>
      {#if mine}
        <Btn onclick={() => app.go('publicar', { editCol: 'services', editId: id })}>✏️ Editar mi publicación</Btn>
      {:else}
        <Btn variant="wa" onclick={() => contactarServicio(s)}>💬 Escribir por WhatsApp</Btn>
        <Btn variant="borde" onclick={darVistoBueno}>{yaDio ? '💜 Ya lo recomendaste' : '👍 Dar mi Visto Bueno'}</Btn>
        <p class="text-center text-xs font-semibold text-gris">🔒 El número no se muestra; WhatsApp se abre con un mensaje listo.</p>
      {/if}
    </Screen>
  </div>
{/if}
