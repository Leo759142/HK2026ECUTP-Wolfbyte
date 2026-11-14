<script>
  let { class: clase = '', children } = $props();
</script>

<div class="flex flex-1 flex-col gap-4 px-5 pb-6 pt-4 {clase}">{@render children?.()}</div>
