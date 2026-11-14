<script>
  import Chip from '../../ui/Chip.svelte';
  import ChipPendiente from '../../ui/ChipPendiente.svelte';
  import { minutosRestantes } from './comun.js';
  let { f, userId } = $props();
</script>

{#if f.status === 'pendiente'}
  <ChipPendiente />
{:else if f.status === 'reservado'}
  <Chip class="bg-ambar-claro text-tinta">⏳ Reservado{f.takerId === userId ? ' para ti' : ''} · {minutosRestantes(f)} min</Chip>
{:else if f.status === 'cerrado'}
  <Chip class="bg-morado-claro text-morado-osc">✅ Cerrado y confirmado</Chip>
{:else if f.status === 'oculto'}
  <Chip class="bg-linea text-gris">🙈 Oculto por un Guardián</Chip>
{:else}
  <Chip class="bg-petroleo-claro text-petroleo-osc">Disponible</Chip>
{/if}
