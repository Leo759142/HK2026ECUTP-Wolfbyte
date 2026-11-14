<!-- 5.3 Dar Visto Bueno (1 a 6 etiquetas, solo positivo) -->
<script>
  import { app, datos } from '../../estado.svelte.js';
  import { ETIQUETAS, MAX_ETIQUETAS, catById } from '../../data.js';
  import { cuadrasTxt, nombreVisible } from '../../util.js';
  import { darVistoBueno } from '../../acciones.js';
  import Btn from '../../ui/Btn.svelte';
  import EmptyState from '../../ui/EmptyState.svelte';
  import Field from '../../ui/Field.svelte';
  import H1 from '../../ui/H1.svelte';
  import Header from '../../ui/Header.svelte';
  import Screen from '../../ui/Screen.svelte';
  import TextArea from '../../ui/TextArea.svelte';
  import { serviciosVisibles } from './comun.js';

  let { id } = $props();
  let tags = $state([]);
  let comment = $state('');
  const s = $derived(serviciosVisibles(app.user).find((x) => x.id === id));
  const permitido = $derived(
    s && datos.contacts.some((c) => c.serviceId === id && c.userId === app.user.id && c.attended) && !datos.recommendations.some((r) => r.serviceId === id && r.userId === app.user.id)
  );
  const toggle = (tagId) => (tags = tags.includes(tagId) ? tags.filter((x) => x !== tagId) : tags.length < MAX_ETIQUETAS ? [...tags, tagId] : tags);
  function enviar() {
    darVistoBueno(id, tags, comment.trim());
    app.replace('gracias', { id });
  }
</script>

{#if !permitido}
  <Screen>
    <Header />
    <EmptyState emoji="🤝" title="Aún no puedes recomendar este servicio">Solo pueden dar Visto Bueno los vecinos que fueron atendidos (y una sola vez).</EmptyState>
  </Screen>
{:else}
  <Screen>
    <Header title="Elige de 1 a 6" />
    <div class="flex items-center gap-3">
      <span class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-ambar-claro text-3xl" aria-hidden="true">{catById(s.categoria).emoji}</span>
      <div>
        <div class="font-black">{nombreVisible(s.owner, true)}</div>
        <div class="text-sm font-semibold text-gris">{s.titulo} · {cuadrasTxt(s.dist)}</div>
      </div>
    </div>
    <H1>¿Qué destacas de {s.owner.firstName}?</H1>
    <div class="grid grid-cols-2 gap-2.5">
      {#each ETIQUETAS as e (e.id)}
        {@const on = tags.includes(e.id)}
        <button type="button" aria-pressed={on} onclick={() => toggle(e.id)} class="flex min-h-[56px] items-center gap-2 rounded-2xl border-2 px-3 text-left text-sm font-extrabold {on ? 'border-morado bg-morado-claro text-morado-osc' : 'border-linea bg-white'}">
          <span class="text-xl" aria-hidden="true">{e.emoji}</span>
          <span class="flex-1">{e.label}</span>
          {#if on}<span aria-hidden="true">✓</span>{/if}
        </button>
      {/each}
    </div>
    <div class="text-sm font-bold text-morado-osc">{tags.length} de 6 elegidas</div>
    <Field label="Comentario (opcional)"><TextArea bind:value={comment} maxlength={140} placeholder="Ej: Llegó en 20 minutos y cobró lo justo." /></Field>
    <p class="text-xs font-semibold text-gris">¿Tuviste una mala experiencia? No hay calificaciones negativas: usa “Reportar” y lo revisará un Guardián.</p>
    <div class="flex-1"></div>
    <Btn variant="acento" disabled={tags.length === 0} onclick={enviar}>👍 Dar mi Visto Bueno</Btn>
  </Screen>
{/if}
