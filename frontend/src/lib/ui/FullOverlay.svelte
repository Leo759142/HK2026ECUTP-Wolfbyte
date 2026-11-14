<!-- Pantalla completa encima de todo (alertas de emergencia). -->
<script>
  let { class: clase = 'bg-crema', children } = $props();
</script>

<div class="fixed inset-0 z-50 flex justify-center bg-petroleo-osc/40">
  <div role="alertdialog" aria-modal="true" class="flex w-full max-w-[430px] flex-col overflow-y-auto {clase}">{@render children?.()}</div>
</div>
