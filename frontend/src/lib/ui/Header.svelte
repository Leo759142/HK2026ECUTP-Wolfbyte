<script>
  import { app } from '../estado.svelte.js';
  import Icon from './Icon.svelte';
  let { title = '', right, onBack, light = false } = $props();
</script>

<div class="-ml-2 flex items-center gap-1">
  <button
    type="button"
    aria-label="Volver"
    onclick={() => (onBack ?? app.back)()}
    class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl font-black {light ? 'text-white active:bg-white/15' : 'text-tinta active:bg-linea'}">
    <Icon name="fa-arrow-left" class="text-2xl font-black" />
  </button>
  <div class="min-w-0 flex-1 truncate text-base font-extrabold {light ? 'text-white' : 'text-gris'}">{title}</div>
  {@render right?.()}
</div>
