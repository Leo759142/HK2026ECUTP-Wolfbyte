<script>
  import Icon from './Icon.svelte';
  let { emergencia, tipo } = $props();
</script>

<div class="bg-rojo px-5 pb-3 pt-3 text-sm font-extrabold text-white" role="status">
  <Icon name="fa-triangle-exclamation" /> Modo emergencia · {tipo?.label ?? 'Emergencia'}
  {#if emergencia?.zona}<span class="font-semibold opacity-90"> · {emergencia.zona}</span>{/if}
</div>
