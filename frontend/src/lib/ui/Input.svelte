<script>
  let { value = $bindable(''), class: clase = '', ...resto } = $props();
</script>

<input
  bind:value
  class="w-full rounded-2xl border-2 border-linea bg-white px-4 text-base font-semibold text-tinta placeholder:text-gris/70 focus:border-morado focus:outline-none min-h-[52px] {clase}"
  {...resto} />
