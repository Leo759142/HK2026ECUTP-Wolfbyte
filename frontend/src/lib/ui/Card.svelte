<script>
  let { onclick, class: clase = '', children } = $props();
  const base = $derived(`flex w-full gap-3 rounded-[20px] border border-linea bg-white p-3.5 text-left ${clase}`);
</script>

{#if onclick}
  <button type="button" {onclick} class="{base} transition active:scale-[.99]">{@render children?.()}</button>
{:else}
  <div class={base}>{@render children?.()}</div>
{/if}
