<script>
  import { useGlottalNormalization } from '$lib/utils/linguistic.ts';
  let { value = $bindable(''), class: clase = '', ...resto } = $props();
  useGlottalNormalization();
</script>

<textarea
  rows="3"
  bind:value
  class="w-full rounded-2xl border-2 border-linea bg-white px-4 text-base font-semibold text-tinta placeholder:text-gris/70 focus:border-morado focus:outline-none resize-none py-3 {clase}"
  {...resto}></textarea>
