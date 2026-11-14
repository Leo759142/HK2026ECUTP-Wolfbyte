<script>
  let { class: clase = '', children } = $props();
</script>

<h1 class="text-2xl font-black leading-tight {clase}">{@render children?.()}</h1>
