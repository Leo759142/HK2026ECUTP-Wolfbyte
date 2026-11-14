<!-- Opciones simples en fila (Unas horas · 1 día · Varios días). -->
<script>
  import Icon from './Icon.svelte';
  let { options, value, onChange, tone = 'morado' } = $props();
  const on = $derived(tone === 'rojo' ? 'border-rojo bg-rojo text-white' : 'border-morado bg-morado text-white');
</script>

<div class="flex flex-wrap gap-2">
  {#each options as o (typeof o === 'string' ? o : o.id)}
    {@const id = typeof o === 'string' ? o : o.id}
    <button
      type="button"
      aria-pressed={value === id}
      onclick={() => onChange(id)}
      class="min-h-[48px] flex-1 rounded-2xl border-2 px-3 text-sm font-extrabold {value === id ? on : 'border-linea bg-white text-tinta'}">
      {#if typeof o !== 'string' && o.icon}<Icon name={o.icon} />{/if}
      {typeof o === 'string' ? o : o.label}
    </button>
  {/each}
</div>
