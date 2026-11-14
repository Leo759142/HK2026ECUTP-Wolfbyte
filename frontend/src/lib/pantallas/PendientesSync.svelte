<!-- Cambios que el servidor no aceptó: nunca se borran solos; el vecino decide reintentar o descartar. -->
<script>
  import { app, datos } from '../estado.svelte.js';
  import { quitar, reintentar } from '../sync/cola.js';
  import { programarSync } from '../sync/motor.js';
  import EmptyState from '../ui/EmptyState.svelte';
  import H1 from '../ui/H1.svelte';
  import Header from '../ui/Header.svelte';
  import Screen from '../ui/Screen.svelte';
  import Sub from '../ui/Sub.svelte';

  const rechazadas = $derived(datos.outbox.filter((o) => o.usuarioId === app.user?.id && o.estado === 'rechazada'));
  const btn = 'min-h-[44px] flex-1 rounded-xl border-2 border-linea bg-white px-2 text-xs font-extrabold';
</script>

<Screen class="gap-3">
  <Header title="Envíos" />
  <H1>Cambios que no se pudieron enviar</H1>
  <Sub>El servidor no los aceptó. Puedes intentarlo de nuevo o descartarlos.</Sub>
  {#each rechazadas as o (o.op_id)}
    <div class="flex flex-col gap-2 rounded-[20px] border-2 border-rojo bg-white p-4">
      <div class="font-black">{o.descripcion || o.entidad}</div>
      <div class="text-sm font-semibold text-rojo-osc">{o.error?.mensaje ?? 'Rechazado por el servidor'}</div>
      <div class="flex gap-2">
        <button
          type="button"
          class={btn}
          onclick={() => {
            reintentar(o.op_id);
            programarSync(0);
          }}>🔁 Reintentar</button>
        <button
          type="button"
          class={btn}
          onclick={() => {
            if (window.confirm('¿Descartar este cambio? No se enviará.')) quitar([o.op_id]);
          }}>🗑️ Descartar</button>
      </div>
    </div>
  {:else}
    <EmptyState emoji="✅" title="Todo enviado" />
  {/each}
</Screen>
