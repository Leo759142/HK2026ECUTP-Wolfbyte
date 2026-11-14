<script>
  let { value = $bindable(), class: clase = '', children, ...resto } = $props();
</script>

<select
  bind:value
  class="w-full rounded-2xl border-2 border-linea bg-white px-4 text-base font-semibold text-tinta focus:border-morado focus:outline-none min-h-[52px] {clase}"
  {...resto}>{@render children?.()}</select>
