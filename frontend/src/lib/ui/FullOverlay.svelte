<!-- Pantalla completa encima de todo (alertas de emergencia). -->
<script>
  import LogoApp from './LogoApp.svelte';
  let { class: clase = 'bg-crema', children } = $props();
</script>

<div class="fixed inset-0 z-50 flex justify-center bg-petroleo-osc/40">
  <div role="alertdialog" aria-modal="true" class="flex w-full max-w-[430px] flex-col overflow-y-auto {clase}">
    <!-- Misma marca y posición que en App.svelte (el overlay tapa la del shell). -->
    <header class="flex items-center px-5 pt-[calc(2rem+env(safe-area-inset-top,0px))]"><LogoApp size={32} conNombre /></header>
    {@render children?.()}
  </div>
</div>
