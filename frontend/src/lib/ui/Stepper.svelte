<script>
  let { value, onChange, min = 1, max = 20 } = $props();
  const btn = 'flex h-12 w-12 items-center justify-center rounded-full border-2 border-linea bg-white text-2xl font-black disabled:opacity-40';
</script>

<div class="flex items-center gap-4">
  <button type="button" aria-label="Menos" class={btn} disabled={value <= min} onclick={() => onChange(value - 1)}>−</button>
  <span class="w-6 text-center text-2xl font-black">{value}</span>
  <button type="button" aria-label="Más" class={btn} disabled={value >= max} onclick={() => onChange(value + 1)}>+</button>
</div>
