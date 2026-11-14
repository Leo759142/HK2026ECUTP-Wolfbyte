<script>
  import Btn from '../../ui/Btn.svelte';
  let { editando, valido, onclick } = $props();
  let enviando = $state(false);
  async function click() {
    enviando = true;
    try {
      await onclick();
    } finally {
      enviando = false;
    }
  }
</script>

<div class="flex-1"></div>
<Btn variant="acento" disabled={!valido || enviando} onclick={click}>{editando ? 'Guardar cambios' : 'Publicar ✓'}</Btn>
