<!-- 1.9 Bienvenida -->
<script>
  import { app } from '../../estado.svelte.js';
  import Btn from '../../ui/Btn.svelte';
  import Chip from '../../ui/Chip.svelte';
  import Circle from '../../ui/Circle.svelte';

  const vecinos = $derived(app.sector?.totalVecinos || app.users.filter((u) => u.sectorId === app.user?.sectorId).length);
</script>

<div class="flex flex-1 flex-col items-center gap-4 bg-petroleo px-7 pb-10 pt-6 text-center text-white">
  <div class="flex-1"></div>
  <Circle emoji="🎉" class="bg-white" />
  <h1 class="text-3xl font-black leading-tight">¡Bienvenido(a) a AYNI, {app.user?.firstName}!</h1>
  <Chip class="bg-white text-petroleo-osc">✅ Vecino(a) verificado(a)</Chip>
  <p class="text-lg font-semibold opacity-90">Ya eres parte de {app.sector?.name}. {vecinos} vecinos ya están aquí.</p>
  <div class="grid w-full grid-cols-3 gap-2.5">
    {#each [['🔧', 'Oficios'], ['🤝', 'Favores'], ['🛡️', 'Cuidarnos']] as [e, l] (l)}
      <div class="flex flex-col items-center gap-1 rounded-2xl bg-white/15 p-3 text-sm font-extrabold">
        <span class="text-2xl" aria-hidden="true">{e}</span>{l}
      </div>
    {/each}
  </div>
  <div class="flex-1"></div>
  <Btn variant="blanco" onclick={() => app.reset('inicio')}>Entrar a AYNI →</Btn>
</div>
