<script lang="ts">
  import { onMount } from 'svelte';
  import { WifiOff } from 'lucide-svelte';

  let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  onMount(() => {
    const handleOnline = () => (isOnline = true);
    const handleOffline = () => (isOnline = false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  });
</script>

{#if !isOnline}
  <div class="fixed bottom-4 left-4 z-[900] flex items-center gap-2 rounded-xl bg-amber-500/90 text-slate-950 px-3 py-2 text-xs font-bold shadow-2xl backdrop-blur-md border border-amber-400 animate-bounce">
    <WifiOff class="w-4 h-4 shrink-0" />
    <span>Modo Offline: Operando con datos de LocalStorage y caché de tiles.</span>
  </div>
{/if}
