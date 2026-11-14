<script>
  import { app } from '../../estado.svelte.js';
  import { cuadras, cuadrasTxt, hace, nombreVisible } from '../../util.js';
  import EstadoChip from './EstadoChip.svelte';
  import TipoChip from './TipoChip.svelte';
  let { f, onclick, children } = $props();
  const me = $derived(app.user);
  const owner = $derived(app.users.find((u) => u.id === f.ownerId));
</script>

<div class="flex flex-col gap-2 rounded-[20px] border bg-white p-3.5 {f.status === 'pendiente' ? 'border-dashed border-gris' : 'border-linea'}">
  <button type="button" {onclick} class="flex flex-col gap-2 text-left">
    <span class="flex w-full items-center justify-between gap-2">
      <TipoChip tipo={f.tipo} />
      <span class="text-xs font-semibold text-gris">{hace(f.createdAt)}</span>
    </span>
    <span class="flex w-full gap-3">
      {#if f.foto}<img src={f.foto} alt="" class="h-14 w-14 shrink-0 rounded-xl object-cover" />{/if}
      <span class="text-base font-bold leading-snug">{f.titulo}</span>
    </span>
    <span class="flex w-full flex-wrap items-center justify-between gap-2">
      <span class="text-sm font-semibold text-gris">{f.ownerId === me.id ? 'Tú' : nombreVisible(owner)} · Mz. {owner?.manzana} · {cuadrasTxt(cuadras(me.manzana, owner?.manzana))}</span>
      {#if f.status !== 'disponible'}<EstadoChip {f} userId={me.id} />{/if}
    </span>
  </button>
  {@render children?.()}
</div>
