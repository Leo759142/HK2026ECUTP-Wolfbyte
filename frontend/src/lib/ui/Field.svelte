<!-- Campo con título. Con un input/textarea/select la etiqueta lo envuelve (asociación nativa);
     con grupos de botones (grupo) se usa role="group": un <label> alrededor de varios botones
     hace que el navegador active siempre el primero. -->
<script>
  let { label, hint = '', grupo = false, children } = $props();
  const id = `campo-${Math.random().toString(36).slice(2, 9)}`;
</script>

{#if grupo}
  <div role="group" aria-labelledby={id} class="flex flex-col gap-1.5">
    <div {id} class="text-sm font-extrabold text-gris">{label}</div>
    {@render children?.()}
    {#if hint}<span class="text-xs font-semibold text-gris">{hint}</span>{/if}
  </div>
{:else}
  <label class="flex flex-col gap-1.5">
    <span class="text-sm font-extrabold text-gris">{label}</span>
    {@render children?.()}
    {#if hint}<span class="text-xs font-semibold text-gris">{hint}</span>{/if}
  </label>
{/if}
