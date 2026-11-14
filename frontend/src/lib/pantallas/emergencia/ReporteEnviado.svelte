<!-- 4.2 Reporte enviado (esperando al Guardián) -->
<script>
  import { app, datos } from '../../estado.svelte.js';
  import { hora } from '../../util.js';
  import Btn from '../../ui/Btn.svelte';
  import Circle from '../../ui/Circle.svelte';
  import H1 from '../../ui/H1.svelte';
  import NumerosEmergencia from '../../ui/NumerosEmergencia.svelte';
  import Screen from '../../ui/Screen.svelte';
  import Steps from '../../ui/Steps.svelte';
  import Sub from '../../ui/Sub.svelte';

  let { id } = $props();
  const e = $derived(datos.emergencies.find((x) => x.id === id));
</script>

<Screen class="text-center">
  <div class="flex-1"></div>
  <Circle emoji="⏳" class="bg-ambar-claro" />
  <H1>Reporte enviado</H1>
  <Sub>Un Guardián de tu sector lo revisará en breve. Te avisaremos apenas responda.</Sub>
  <div class="text-left">
    <Steps
      items={[
        ['✅', 'Enviado', e && hora(e.createdAt), true],
        [e?.status === 'pendiente' ? '⏳' : '✅', 'Revisión del Guardián', e?.status === 'pendiente' ? 'En curso' : 'Listo', true],
        [e?.status === 'activa' ? '✅' : '⚪', 'Aviso a tus vecinos', '', e?.status === 'activa'],
      ]} />
  </div>
  <p class="text-left text-sm font-extrabold text-rojo-osc">¿Hay peligro inmediato? Llama ya:</p>
  <NumerosEmergencia />
  <div class="flex-1"></div>
  {#if app.isGuardian}<Btn variant="acento" onclick={() => app.go('panelGuardian')}>🛡️ Revisarlo en mi panel</Btn>{/if}
  <Btn variant="borde" onclick={() => app.reset('inicio')}>Volver al inicio</Btn>
</Screen>
