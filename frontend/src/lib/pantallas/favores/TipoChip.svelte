<script>
  import { TIPOS_FAVOR } from '../../data.js';
  import Chip from '../../ui/Chip.svelte';
  let { tipo } = $props();
  const t = $derived(TIPOS_FAVOR[tipo]);
</script>

<Chip class={t.chip}>{t.emoji} {t.label}</Chip>
