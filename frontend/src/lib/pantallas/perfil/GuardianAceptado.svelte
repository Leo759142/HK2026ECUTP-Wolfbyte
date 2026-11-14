<!-- 6.7 Ya eres Guardián -->
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
  <div><Chip class="bg-morado-claro text-sm text-morado-osc">Guardián de {app.sector?.name}</Chip></div>
  <H1>¡Ya eres Guardián!</H1>
  <Sub>Te avisaremos cuando un vecino reporte una emergencia o una publicación necesite revisión.</Sub>
  <div class="flex-1"></div>
  <Btn
    variant="acento"
    onclick={() => {
      app.reset('perfil');
      app.go('panelGuardian');
    }}>Ir a mi panel</Btn>
  <Btn variant="borde" onclick={() => app.reset('inicio')}>Volver al inicio</Btn>
</Screen>
