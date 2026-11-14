<script>
  import { app } from '../estado.svelte.js';
  import { comprimirImagen } from '../util.js';
  import Icon from './Icon.svelte';
  let { value, onChange } = $props();
  let input;

  async function elegir(event) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    try {
      onChange(await comprimirImagen(file));
    } catch {
      app.notify('No se pudo leer la foto');
    }
  }
</script>

<div class="flex items-center gap-3">
  {#if value}<img src={value} alt="Foto adjunta" class="h-14 w-14 rounded-xl object-cover" />{/if}
  <button type="button" onclick={() => input?.click()} class="min-h-[48px] rounded-full border-2 border-linea bg-white px-4 text-sm font-extrabold">
    <Icon name="fa-camera" /> {value ? 'Cambiar foto' : 'Agregar foto (opcional)'}
  </button>
  {#if value}
    <button type="button" onclick={() => onChange(null)} class="min-h-[48px] px-2 text-sm font-bold text-gris">Quitar</button>
  {/if}
  <input bind:this={input} type="file" accept="image/*" class="hidden" onchange={elegir} />
</div>
