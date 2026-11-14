<script>
  let { class: clase = '', children, ...resto } = $props();
</script>

<button type="button" class="min-h-[48px] w-full text-center text-sm font-extrabold text-petroleo underline-offset-4 hover:underline {clase}" {...resto}>{@render children?.()}</button>
