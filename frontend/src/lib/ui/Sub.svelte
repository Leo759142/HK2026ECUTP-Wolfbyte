<script>
  let { class: clase = '', children } = $props();
</script>

<p class="text-base font-semibold leading-snug text-gris {clase}">{@render children?.()}</p>
