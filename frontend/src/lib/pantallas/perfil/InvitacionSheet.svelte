<!-- 6.6 Invitación a Guardián (llega sola a los 2 meses) -->
<script>
  import { app } from '../../estado.svelte.js';
  import { responderInvitacion } from '../../acciones.js';
  import Btn from '../../ui/Btn.svelte';
  import Circle from '../../ui/Circle.svelte';
  import Sheet from '../../ui/Sheet.svelte';

  let { onClose } = $props();
  function responder(acepta) {
    responderInvitacion(acepta);
    if (acepta) app.go('guardianAceptado');
    else onClose?.();
  }
</script>

<Sheet onClose={() => responder(false)}>
  <Circle emoji="🛡️" class="h-24 w-24 bg-morado" />
  <h2 class="text-center text-xl font-black">¡Llevas 2 meses ayudando en AYNI!</h2>
  <p class="text-center font-semibold text-gris">Tus vecinos confían en ti. ¿Quieres ser Guardián de {app.sector?.name}?</p>
  <ul class="flex flex-col gap-1.5 rounded-2xl bg-morado-claro p-4 text-sm font-extrabold text-morado-osc">
    <li>✅ Confirmar o descartar emergencias</li>
    <li>✅ Avisar cuando la emergencia fue atendida</li>
    <li>✅ Revisar publicaciones reportadas</li>
  </ul>
  <Btn variant="acento" onclick={() => responder(true)}>Acepto ser Guardián</Btn>
  <Btn variant="borde" onclick={() => responder(false)}>Ahora no</Btn>
</Sheet>
