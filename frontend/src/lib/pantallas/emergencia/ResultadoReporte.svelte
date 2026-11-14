<!-- 4.4 / 4.5 Respuesta al vecino que reportó (overlay) -->
<script>
  import { app } from '../../estado.svelte.js';
  import { hora, nombreVisible } from '../../util.js';
  import { acusarEmergencia } from '../../acciones.js';
  import Btn from '../../ui/Btn.svelte';
  import Circle from '../../ui/Circle.svelte';
  import FullOverlay from '../../ui/FullOverlay.svelte';
  import H1 from '../../ui/H1.svelte';
  import NumerosEmergencia from '../../ui/NumerosEmergencia.svelte';
  import Screen from '../../ui/Screen.svelte';
  import Steps from '../../ui/Steps.svelte';
  import Sub from '../../ui/Sub.svelte';

  let { e } = $props();
  const guardian = $derived(app.users.find((u) => u.id === (e.confirmedBy ?? e.reviewedBy)));
  const vecinos = $derived(app.sector?.totalVecinos || app.users.filter((u) => u.sectorId === e.sectorId).length);
  function cerrar(destino) {
    acusarEmergencia(e, { reporteroVisto: true, respuesta: e.status === 'activa' ? 'visto' : undefined });
    app.reset(destino);
  }
</script>

{#if e.status === 'activa'}
  <FullOverlay>
    <Screen class="text-center">
      <div class="flex-1"></div>
      <Circle emoji="✅" class="bg-rojo-claro" />
      <H1>Tu reporte fue confirmado</H1>
      <Sub>Un Guardián activó el modo emergencia en tu sector. Tus vecinos ya fueron avisados. ¡Gracias por avisar!</Sub>
      <div class="text-left">
        <Steps items={[['✅', 'Enviado', hora(e.createdAt), true], ['✅', `Confirmado por ${nombreVisible(guardian)} (Guardián)`, hora(e.confirmedAt), true], ['✅', 'Vecinos avisados', `${vecinos} vecinos`, true]]} />
      </div>
      <div class="flex-1"></div>
      <Btn variant="rojo" onclick={() => cerrar('inicio')}>Ver la emergencia</Btn>
    </Screen>
  </FullOverlay>
{:else}
  <FullOverlay>
    <Screen class="text-center">
      <div class="flex-1"></div>
      <Circle emoji="ℹ️" class="bg-ambar-claro" />
      <H1>No se activó la emergencia</H1>
      <Sub>Un Guardián revisó tu reporte. Gracias por estar atento a tu sector.</Sub>
      {#if e.motivo}
        <div class="rounded-[20px] border border-linea bg-white p-4 text-left">
          <div class="text-sm font-extrabold text-gris">Motivo del Guardián</div>
          <p class="font-semibold">“{e.motivo}”</p>
        </div>
      {/if}
      <p class="text-left text-sm font-extrabold text-rojo-osc">Si crees que es grave, llama directamente:</p>
      <NumerosEmergencia />
      <div class="flex-1"></div>
      <Btn onclick={() => cerrar('inicio')}>Entendido</Btn>
    </Screen>
  </FullOverlay>
{/if}
