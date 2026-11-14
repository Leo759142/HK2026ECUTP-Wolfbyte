<!-- 6.9 Reportar publicación (con 3 reportes el servidor la oculta sola) -->
<script>
  import { app, datos } from '../../estado.svelte.js';
  import { MOTIVOS_REPORTE, REPORTES_PARA_OCULTAR } from '../../data.js';
  import { reportar } from '../../acciones.js';
  import Btn from '../../ui/Btn.svelte';
  import EmptyState from '../../ui/EmptyState.svelte';
  import H1 from '../../ui/H1.svelte';
  import Header from '../../ui/Header.svelte';
  import Screen from '../../ui/Screen.svelte';
  import Sub from '../../ui/Sub.svelte';

  let { col, id } = $props();
  let motivo = $state(MOTIVOS_REPORTE[0]);
  const yaReporto = $derived(datos.reports.some((r) => r.col === col && r.targetId === id && r.userId === app.user.id));
  function enviar() {
    reportar(col, id, motivo);
    app.notify('Gracias. Un Guardián lo revisará.');
    app.back();
  }
</script>

<Screen>
  <Header title="Reportar" />
  <H1>¿Por qué reportas esta publicación?</H1>
  {#if yaReporto}
    <EmptyState emoji="✅" title="Ya enviaste un reporte">Un Guardián lo está revisando.</EmptyState>
  {:else}
    <div class="flex flex-col gap-2" role="radiogroup">
      {#each MOTIVOS_REPORTE as m (m)}
        <button type="button" role="radio" aria-checked={motivo === m} onclick={() => (motivo = m)} class="flex min-h-[56px] items-center justify-between rounded-2xl border-2 px-4 text-left font-bold {motivo === m ? 'border-petroleo bg-petroleo-claro' : 'border-linea bg-white'}">
          {m}
          {#if motivo === m}<span aria-hidden="true">✓</span>{/if}
        </button>
      {/each}
    </div>
    <Sub class="text-sm">Un Guardián lo revisará. Tu nombre no se muestra a quien publicó. Con {REPORTES_PARA_OCULTAR} reportes, la publicación se oculta mientras se revisa.</Sub>
    <div class="flex-1"></div>
    <Btn onclick={enviar}>Enviar reporte</Btn>
  {/if}
</Screen>
