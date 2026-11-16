<script lang="ts">
  import { onMount } from 'svelte';
  import { Download, Share } from 'lucide-svelte';

  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  }

  let deferredPrompt: BeforeInstallPromptEvent | null = null;
  let isInstalled = false;
  let isIOS = false;
  let showIOSGuide = false;

  onMount(() => {
    // Detectar si ya corre en standalone
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    isInstalled = isStandalone;

    // Detectar iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    isIOS = /iphone|ipad|ipod/.test(userAgent);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
    };

    const handleInstalled = () => {
      isInstalled = true;
      deferredPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  });

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      isInstalled = true;
      deferredPrompt = null;
    }
  }
</script>

{#if !isInstalled}
  {#if deferredPrompt}
    <button
      on:click={handleInstall}
      class="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md hover:from-blue-500 hover:to-indigo-500 transition active:scale-95"
    >
      <Download class="w-3.5 h-3.5" />
      <span>Instalar PWA</span>
    </button>
  {:else if isIOS}
    <button
      on:click={() => (showIOSGuide = true)}
      class="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
    >
      <Download class="w-3.5 h-3.5 text-blue-400" />
      <span>Instalar en iOS</span>
    </button>

    {#if showIOSGuide}
      <div class="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div class="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100 flex flex-col gap-3">
          <h3 class="text-base font-bold text-white flex items-center gap-2">
            <Share class="w-4 h-4 text-blue-400" />
            Instalar en iPhone / iPad
          </h3>
          <p class="text-xs text-slate-300 leading-relaxed">
            1. Toca el botón <strong>Compartir</strong> <span class="inline-block px-1 bg-slate-800 rounded">⎙</span> en la barra inferior de Safari.<br />
            2. Desplázate hacia abajo y selecciona <strong>«Agregar a Inicio»</strong>.
          </p>
          <button
            on:click={() => (showIOSGuide = false)}
            class="mt-2 w-full rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition"
          >
            Cerrar guía
          </button>
        </div>
      </div>
    {/if}
  {/if}
{/if}
