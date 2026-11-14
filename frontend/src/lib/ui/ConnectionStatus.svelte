<!-- Estados técnicos de la PWA: en línea (punto verde) o sin conexión (cintillo),
     más lo que aún está en la cola de envío y lo que el servidor rechazó. -->
<script>
  import { app, datos } from '../estado.svelte.js';
  import Icon from './Icon.svelte';

  const mias = $derived(datos.outbox.filter((o) => o.usuarioId === app.user?.id));
  const pendientes = $derived(mias.filter((o) => o.estado === 'pendiente').length);
  const rechazadas = $derived(mias.filter((o) => o.estado === 'rechazada').length);
</script>

{#if app.online}
  <div class="flex items-center gap-2 text-xs font-bold text-gris">
    <span class="h-2.5 w-2.5 rounded-full bg-wa" aria-hidden="true"></span>
    {app.t('enLinea')}
    {#if pendientes > 0}<span>· <Icon name="fa-clock" /> {pendientes} por enviar</span>{/if}
  </div>
{:else}
  <div role="status" class="rounded-xl border border-ambar bg-ambar-claro px-3 py-2 text-sm font-bold">
    <Icon name="fa-wifi" />
    {app.t('sinConexion')}
    {#if pendientes > 0}<span class="block text-xs">🕓 {pendientes} cambio(s) se enviarán al volver la señal.</span>{/if}
  </div>
{/if}
{#if rechazadas > 0}
  <button type="button" onclick={() => app.go('pendientesSync')} class="rounded-xl border border-rojo bg-rojo-claro px-3 py-2 text-left text-sm font-bold text-rojo-osc">
    ⚠️ {rechazadas} cambio(s) no se pudieron enviar · Ver
  </button>
{/if}
