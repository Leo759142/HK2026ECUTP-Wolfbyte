<!-- Logo de AYNI (mismo ícono de la PWA). `size` en px; `conNombre` agrega el texto "AYNI" al lado. -->
<script>
  let { size = 32, conNombre = false, class: clase = '' } = $props();
</script>

<span class="inline-flex items-center gap-2 {clase}">
  <img
    src="/icon-192.png"
    alt={conNombre ? '' : 'AYNI'}
    width={size}
    height={size}
    style="width: {size}px; height: {size}px"
    class="shrink-0 rounded-[28%] shadow-sm" />
  {#if conNombre}<span class="text-lg font-black tracking-wide">AYNI</span>{/if}
</span>
