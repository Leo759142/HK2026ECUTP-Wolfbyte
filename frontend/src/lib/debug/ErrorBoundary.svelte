<!-- ErrorBoundary.svelte - Captura errores en el árbol de componentes -->
<script>
  import { onMount } from 'svelte';
  import { logger } from './logger.js';

  let { fallback, children } = $props();
  let hasError = $state(false);
  let error = $state(null);
  let errorInfo = $state(null);

  function reset() {
    hasError = false;
    error = null;
    errorInfo = null;
  }

  // Capturar errores no manejados en el árbol
  onMount(() => {
    const handleError = (event) => {
      if (event.target === window) {
        hasError = true;
        error = event.error || new Error(event.message);
        errorInfo = { filename: event.filename, lineno: event.lineno, colno: event.colno };
        
        logger.error('render', 'Uncaught error in component tree', {
          message: error.message,
          stack: error.stack,
          ...errorInfo
        });

        event.preventDefault();
      }
    };

    const handlePromiseRejection = (event) => {
      logger.error('render', 'Unhandled promise rejection', {
        reason: event.reason?.message || event.reason,
        stack: event.reason?.stack
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handlePromiseRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handlePromiseRejection);
    };
  });

  // Exponer método para que componentes hijos puedan reportar errores
  // (se usa vía contexto en componentes que necesiten reportar errores controlados)
</script>

{#if hasError}
  {#snippet fallback()}
    <div class="fixed inset-0 z-[100] flex items-center justify-center bg-white/95 backdrop-blur-sm p-4">
      <div class="max-w-md w-full rounded-2xl border-2 border-rojo bg-white p-6 text-center shadow-xl">
        <div class="text-4xl mb-3">⚠️</div>
        <h2 class="text-xl font-black text-tinta mb-2">Algo salió mal</h2>
        <p class="text-gris mb-4">La aplicación encontró un error inesperado.</p>
        <pre class="text-left text-xs bg-tinta/5 p-3 rounded overflow-auto max-h-40 text-rojo-osc font-mono">
          {error?.message ?? 'Error desconocido'}
          {error?.stack}
        </pre>
        <div class="flex gap-2 justify-center mt-4">
          <button 
            onclick={reset} 
            class="px-4 py-2 rounded-xl bg-morado text-white font-bold"
          >
            Reintentar
          </button>
          <button 
            onclick={() => location.reload()} 
            class="px-4 py-2 rounded-xl border-2 border-linea text-tinta font-bold"
          >
            Recargar página
          </button>
        </div>
      </div>
    </div>
  {/snippet}
{:else}
  {@render children()}
{/if}