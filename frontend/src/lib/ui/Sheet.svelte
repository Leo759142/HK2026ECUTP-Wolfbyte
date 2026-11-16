<!-- Hoja inferior (sheet) sobre la pantalla actual. -->
<script>
  let { onClose, children } = $props();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="fixed inset-0 z-40 flex items-end justify-center bg-petroleo-osc/70" onclick={onClose}>
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div role="dialog" aria-modal="true" tabindex="-1" class="flex max-h-[92svh] w-full max-w-[430px] flex-col gap-3 overflow-y-auto rounded-t-[28px] bg-white px-5 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] pt-3" onclick={(e) => e.stopPropagation()}>
    <div class="mx-auto h-[5px] w-11 rounded-full bg-linea"></div>
    {@render children?.()}
  </div>
</div>
