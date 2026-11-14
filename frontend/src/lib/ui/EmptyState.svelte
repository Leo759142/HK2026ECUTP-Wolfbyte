<script>
  let { emoji, title, children } = $props();
</script>

<div class="flex flex-col items-center gap-2 rounded-[20px] border border-dashed border-linea bg-white px-5 py-8 text-center">
  <span class="text-4xl" aria-hidden="true">{emoji}</span>
  <div class="text-base font-black">{title}</div>
  {#if children}<div class="text-sm font-semibold text-gris">{@render children()}</div>{/if}
</div>
