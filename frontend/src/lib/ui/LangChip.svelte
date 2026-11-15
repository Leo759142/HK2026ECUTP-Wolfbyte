<script>
  import { app } from '../estado.svelte.js';
  import { locale } from '$lib/i18n';
  import Icon from './Icon.svelte';
  let { class: clase = '' } = $props();
</script>

<button
  type="button"
  onclick={() => app.go('ajustes')}
  aria-label="Cambiar idioma"
  class="flex h-12 min-w-[72px] items-center justify-center gap-1 rounded-full border-[1.5px] border-linea bg-white px-3 text-sm font-extrabold text-tinta {clase}">
  <Icon name="fa-globe" /> {$locale.toUpperCase()}
</button>
