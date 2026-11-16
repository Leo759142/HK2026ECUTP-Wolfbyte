<script>
  let { paso, total = 4 } = $props();
</script>

<div class="flex gap-1.5" aria-label="Paso {paso} de {total}">
  {#each Array.from({ length: total }, (_, i) => i + 1) as n (n)}
    <span class="h-1.5 flex-1 rounded-full {n <= paso ? 'bg-petroleo' : 'bg-linea'}"></span>
  {/each}
</div>
