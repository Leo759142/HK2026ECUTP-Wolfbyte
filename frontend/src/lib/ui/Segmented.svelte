<!-- Pestañas tipo "segmento" (Presto · Regalo · Intercambio). La opción puede llevar un ícono (icon). -->
<script>
  import Icon from './Icon.svelte';
  let { options, value, onChange } = $props();
</script>

<div class="flex gap-1 rounded-2xl bg-linea p-1" role="tablist">
  {#each options as o (o.id)}
    <button
      type="button"
      role="tab"
      aria-selected={value === o.id}
      onclick={() => onChange(o.id)}
      class="min-h-[48px] flex-1 rounded-xl px-2 text-sm font-extrabold {value === o.id ? 'bg-white text-morado-osc shadow-sm' : 'text-gris'}">
      {#if o.icon}<Icon name={o.icon} />{/if}
      {o.label}
    </button>
  {/each}
</div>
