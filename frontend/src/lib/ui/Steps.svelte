<!-- Pasos de un proceso (estado del reporte o del pedido de ayuda). items: [icono, título, detalle, activo] -->
<script>
  let { items } = $props();
</script>

<ol class="flex flex-col gap-3 rounded-[20px] border border-linea bg-white p-4">
  {#each items as [icono, titulo, detalle, activo], i (i)}
    <li class="flex items-center gap-3">
      <span class="text-xl" aria-hidden="true">{icono}</span>
      <span class="flex-1">
        <span class="block text-[15px] font-black {activo ? 'text-tinta' : 'text-gris'}">{titulo}</span>
        {#if detalle}<span class="block text-xs font-semibold text-gris">{detalle}</span>{/if}
      </span>
    </li>
  {/each}
</ol>
