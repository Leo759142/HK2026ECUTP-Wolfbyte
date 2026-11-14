<script>
  import { NUMEROS_EMERGENCIA } from '../data.js';
</script>

<div class="grid grid-cols-3 gap-2">
  {#each NUMEROS_EMERGENCIA as n (n.numero)}
    <a href="tel:{n.numero}" class="flex min-h-[52px] flex-col items-center justify-center rounded-2xl border-2 border-rojo bg-white text-rojo-osc">
      <span class="text-sm font-black">{n.emoji} {n.numero}</span>
      <span class="text-[11px] font-bold">{n.label}</span>
    </a>
  {/each}
</div>
