<!-- DebugConsole.svelte - Consola de debug separada con filtros -->
<script>
  import { onMount, onDestroy } from 'svelte';
  import { logger, CATEGORIES } from './logger.js';
  import { debugOpen, toggleDebug } from './store.js';

  let isOpen = $state(false);
  let filterLevel = $state('all');
  let filterCategory = $state('all');
  let searchQuery = $state('');
  let autoScroll = $state(true);
  let logs = $state([]);

  const LEVELS = ['all', 'debug', 'info', 'warn', 'error'];
  const CATS = ['all', ...CATEGORIES];

  const LEVEL_COLORS = {
    debug: 'text-gris',
    info: 'text-azul',
    warn: 'text-ambar',
    error: 'text-rojo',
  };

  const LEVEL_BG = {
    debug: 'bg-gris/10',
    info: 'bg-azul/10',
    warn: 'bg-ambar/10',
    error: 'bg-rojo/10',
  };

  let unsubscribe;
  let storeUnsubscribe;

  onMount(() => {
    unsubscribe = logger.subscribe((entry) => {
      if (entry.type === 'clear') {
        logs = [];
        return;
      }
      logs = [...logs, entry].slice(-logger.maxLogs);
      if (autoScroll) scrollToBottom();
    });
    logs = logger.getLogs({ limit: 200 });

    storeUnsubscribe = debugOpen.subscribe(v => {
      isOpen = v;
    });
  });

  onDestroy(() => {
    unsubscribe?.();
    storeUnsubscribe?.();
  });

  function scrollToBottom() {
    const container = document.getElementById('debug-logs');
    if (container) container.scrollTop = container.scrollHeight;
  }

  function filteredLogs() {
    return logs.filter(entry => {
      if (filterLevel !== 'all' && entry.level !== filterLevel) return false;
      if (filterCategory !== 'all' && entry.category !== filterCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!entry.message.toLowerCase().includes(q) && 
            !JSON.stringify(entry.data).toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }

  function toggle() {
    toggleDebug();
  }

  function clear() {
    logger.clear();
  }

  function exportLogs() {
    const data = JSON.stringify(logs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ayni-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function formatTime(ts) {
    const d = new Date(ts);
    return d.toLocaleTimeString() + '.' + String(d.getMilliseconds()).padStart(3, '0');
  }
</script>

{#if isOpen}
<div class="fixed inset-0 z-[200] flex flex-col bg-tinta/95 backdrop-blur" id="debug-console">
  <!-- Header -->
  <header class="flex items-center justify-between gap-2 border-b border-tinta/20 px-4 py-3 bg-tinta/90">
    <div class="flex items-center gap-3">
      <span class="text-lg">🐛</span>
      <h2 class="font-black text-white">Debug Console</h2>
      <span class="px-2 py-0.5 rounded bg-morado/20 text-morado text-xs font-mono">
        {logs.length} logs
      </span>
    </div>
    <div class="flex items-center gap-2">
      <label class="flex items-center gap-1 text-xs text-gris">
        <input type="checkbox" bind:checked={autoScroll} class="accent-morado" />
        Auto-scroll
      </label>
      <button onclick={exportLogs} class="px-2 py-1 rounded text-xs bg-tinta/50 hover:bg-tinta/30 text-gris hover:text-white transition">
        Exportar
      </button>
      <button onclick={clear} class="px-2 py-1 rounded text-xs bg-tinta/50 hover:bg-tinta/30 text-gris hover:text-white transition">
        Limpiar
      </button>
      <button onclick={toggle} class="p-2 rounded hover:bg-tinta/30 text-gris hover:text-white transition" aria-label="Cerrar">
        ✕
      </button>
    </div>
  </header>

  <!-- Filters -->
  <div class="flex flex-wrap gap-2 px-4 py-2 border-b border-tinta/20 bg-tinta/80">
    <select bind:value={filterLevel} class="px-2 py-1 rounded bg-tinta/50 text-white text-xs border border-tinta/20 focus:outline-none focus:border-morado">
      {#each LEVELS as lvl}
        <option value={lvl}>{lvl === 'all' ? 'Todos los niveles' : lvl.toUpperCase()}</option>
      {/each}
    </select>
    <select bind:value={filterCategory} class="px-2 py-1 rounded bg-tinta/50 text-white text-xs border border-tinta/20 focus:outline-none focus:border-morado">
      {#each CATS as cat}
        <option value={cat}>{cat === 'all' ? 'Todas las categorías' : cat}</option>
      {/each}
    </select>
    <input
      type="text"
      bind:value={searchQuery}
      placeholder="Buscar en logs..."
      class="flex-1 min-w-[150px] px-2 py-1 rounded bg-tinta/50 text-white text-xs border border-tinta/20 focus:outline-none focus:border-morado placeholder:text-gris"
    />
  </div>

  <!-- Logs -->
  <div class="flex-1 overflow-auto p-4" id="debug-logs">
    {#each filteredLogs() as entry (entry.timestamp)}
      <div class="mb-2 last:mb-0 font-mono text-[11px] leading-relaxed">
        <span class="text-gris/50 mr-2">{formatTime(entry.timestamp)}</span>
        <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase {LEVEL_BG[entry.level]} {LEVEL_COLORS[entry.level]} mr-2">
          {entry.level}
        </span>
        <span class="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-morado/20 text-morado mr-2">{entry.category}</span>
        <span class="text-white">{entry.message}</span>
        {#if entry.data && Object.keys(entry.data).length}
          <pre class="mt-1 ml-8 text-[10px] text-gris/70 overflow-auto max-h-24 bg-tinta/30 p-2 rounded">
            {JSON.stringify(entry.data, null, 2)}
          </pre>
        {/if}
      </div>
    {/each}
    {#if filteredLogs().length === 0}
      <div class="flex h-full items-center justify-center text-gris/50 text-sm">No hay logs que coincidan</div>
    {/if}
  </div>
</div>
{/if}

<!-- Toggle button (F12 or click) -->
{#if !isOpen}
<button
  class="fixed bottom-4 right-4 z-[150] p-2 rounded-full bg-tinta/80 text-white shadow-lg hover:bg-tinta transition-opacity"
  onclick={toggle}
  aria-label="Abrir debug console"
  title="Debug Console (F12)"
>
  🐛
</button>
{/if}

<style>
  :global(body.debug-open) {
    /* Espacio para la consola si se quiere persistente */
  }
</style>