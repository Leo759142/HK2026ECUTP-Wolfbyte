<script>
  import { onMount } from 'svelte';
  import { t } from '$lib/i18n';
  import Btn from '../lib/ui/Btn.svelte';
  import { app } from '../lib/estado.svelte.js';
  import { logger } from '../lib/debug/logger.js';

  let { status, message, error } = $props();

  onMount(() => {
    // Log el error al cargar la página de error
    logger.error('render', `Error page loaded: ${status}`, {
      status,
      message,
      errorMessage: error?.message,
      errorStack: error?.stack,
      userId: app.user?.id,
      route: app.route?.name
    });
  });

  function goHome() {
    app.reset('portada');
  }

  function retry() {
    location.reload();
  }
</script>

<div class="min-h-screen bg-crema flex items-center justify-center p-4">
  <div class="mx-auto max-w-md w-full rounded-2xl border-2 border-linea bg-white p-8 shadow-lg text-center">
    <div class="text-5xl mb-3">⚠️</div>
    <h2 class="text-2xl font-black text-tinta mb-2">
      {$t('error.generico') || 'Ocurrió un error inesperado'}
    </h2>
    
    {#if status === 500}
      <p class="text-rojo mb-2 font-semibold">Error del servidor (500)</p>
    {:else if status === 401 || status === 403}
      <p class="text-naranja mb-2 font-semibold">Sesión expirada o no autorizado</p>
    {:else if status === 404}
      <p class="text-ambar mb-2 font-semibold">Página no encontrada</p>
    {:else if status === 0}
      <p class="text-ambar mb-2 font-semibold">Sin conexión</p>
    {/if}

    <p class="text-gris mb-6 text-sm font-mono bg-tinta/5 p-3 rounded text-left max-h-40 overflow-auto">
      {message}
      {#if error?.message}
        <br><br>Detalle: {error.message}
      {/if}
    </p>

    <div class="flex flex-col gap-2">
      <Btn onclick={goHome} class="w-full">
        {$t('error.inicio') || 'Volver al inicio'}
      </Btn>
      <Btn variant="borde" onclick={retry} class="w-full">
        {$t('error.reintentar') || 'Reintentar'}
      </Btn>
      <Btn variant="borde" onclick={app.back} class="w-full">
        {$t('error.regresar') || 'Regresar'}
      </Btn>
    </div>

    {#if import.meta.env.DEV && error?.stack}
      <details class="mt-6 text-left">
        <summary class="cursor-pointer text-xs text-gris font-semibold">Ver stack trace</summary>
        <pre class="mt-2 text-[10px] bg-tinta/5 p-3 rounded overflow-auto max-h-60 text-rojo-osc font-mono">
          {error.stack}
        </pre>
      </details>
    {/if}
  </div>
</div>