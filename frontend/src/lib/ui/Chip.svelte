<script>
  let { class: clase = 'bg-petroleo-claro text-petroleo-osc', children } = $props();
</script>

<span class="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold {clase}">{@render children?.()}</span>
