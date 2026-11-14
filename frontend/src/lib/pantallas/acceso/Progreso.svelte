<script>
  let { paso } = $props();
</script>

<div class="flex gap-1.5" aria-label="Paso {paso} de 4">
  {#each [1, 2, 3, 4] as n (n)}
    <span class="h-1.5 flex-1 rounded-full {n <= paso ? 'bg-petroleo' : 'bg-linea'}"></span>
  {/each}
</div>
