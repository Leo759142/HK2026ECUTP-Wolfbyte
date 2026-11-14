<!-- 0.6 Eres el primer Guardián -->
<script>
  import { app } from '../../estado.svelte.js';
  import Btn from '../../ui/Btn.svelte';
  import Chip from '../../ui/Chip.svelte';
  import Circle from '../../ui/Circle.svelte';
  import H1 from '../../ui/H1.svelte';
  import Screen from '../../ui/Screen.svelte';
  import Sub from '../../ui/Sub.svelte';
</script>

<Screen class="text-center">
  <div class="flex-1"></div>
  <Circle emoji="🛡️" class="bg-morado" />
  <div><Chip class="bg-morado-claro text-morado-osc">Guardián fundador</Chip></div>
  <H1>¡Eres el primer Guardián de {app.sector?.name ?? 'tu sector'}!</H1>
  <Sub>Cuidarás que tu sector sea un lugar de confianza.</Sub>
  <ul class="flex flex-col gap-2 rounded-[20px] border border-linea bg-white p-4 text-left text-[15px] font-bold">
    <li>✅ Confirmar o descartar emergencias</li>
    <li>✅ Avisar cuando la emergencia fue atendida</li>
    <li>✅ Revisar publicaciones reportadas</li>
  </ul>
  <div class="flex-1"></div>
  <Btn onclick={() => app.go('bienvenida')}>Entendido, continuar</Btn>
</Screen>
