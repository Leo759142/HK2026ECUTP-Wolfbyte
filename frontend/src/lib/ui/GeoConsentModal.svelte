<script lang="ts">
  import { CITY_PRESETS, GeoLocationService } from '../servicios/geoService';
  import type { UserLocation } from '../types/poi';

  export let open = false;
  export let onClose: () => void = () => {};
  export let onLocationResolved: (location: UserLocation) => void = () => {};
  export let initialError: string | null = null;
  export let allowManual = true;

  let step: 'prompt' | 'ip_fallback' | 'manual' = 'prompt';
  let loading = false;
  let errorMessage: string | null = null;

  $: errorMessage = initialError ?? errorMessage;
  $: if (open) {
    step = 'prompt';
    loading = false;
    errorMessage = initialError ?? null;
  }

  async function useGps() {
    loading = true;
    errorMessage = null;
    try {
      const loc = await GeoLocationService.getGpsLocation();
      onLocationResolved(loc);
      onClose();
    } catch (e: any) {
      errorMessage = e?.message || 'No se pudo obtener la ubicación por GPS.';
      step = 'ip_fallback';
    } finally {
      loading = false;
    }
  }

  async function useIp() {
    loading = true;
    errorMessage = null;
    try {
      const loc = await GeoLocationService.getIpLocation();
      onLocationResolved(loc);
      onClose();
    } catch (e: any) {
      errorMessage = e?.message || 'No se pudo aproximar por IP.';
      step = 'manual';
    } finally {
      loading = false;
    }
  }

  function choosePreset(preset: (typeof CITY_PRESETS)[number]) {
    const loc: UserLocation = {
      coords: preset.coords,
      provider: 'manual',
      city: preset.name,
      country: preset.country,
      provinciaId: preset.provinciaId,
      distritoId: preset.distritoId,
      timestamp: Date.now(),
    };
    GeoLocationService.setCachedLocation(loc);
    onLocationResolved(loc);
    onClose();
  }
</script>

{#if open}
  <div class="fixed inset-0 z-50 flex items-end justify-center bg-negro/50 p-4 sm:items-center" role="dialog" aria-modal="true" aria-label="Permisos de ubicación">
    <div class="w-full max-w-md rounded-3xl border border-linea bg-white p-5 shadow-xl">
      <div class="mb-3 flex items-start justify-between gap-3">
        <div>
          <div class="text-lg font-black">Ubicación para tu zona</div>
          <div class="text-sm font-semibold text-gris">Solo guardamos una zona aproximada (~100 m), nunca tu dirección exacta.</div>
        </div>
        <button type="button" class="rounded-xl px-2 py-1 text-sm font-extrabold text-gris" on:click={onClose} aria-label="Cerrar">✕</button>
      </div>

      {#if errorMessage}
        <div class="mb-3 rounded-2xl bg-rojo-claro p-3 text-sm font-bold text-rojo-osc">{errorMessage}</div>
      {/if}

      {#if step === 'prompt'}
        <div class="flex flex-col gap-2">
          <div class="rounded-2xl bg-petroleo-claro p-3 text-sm font-semibold text-petroleo-osc">
            Usa GPS para mayor precisión o elige una opción aproximada si prefieres no activar sensores.
          </div>
          <button type="button" disabled={loading} on:click={useGps} class="flex min-h-[52px] items-center justify-center rounded-2xl bg-petroleo font-black text-white disabled:opacity-50">
            {loading ? 'Buscando ubicación…' : '📍 Usar GPS de alta precisión'}
          </button>
          <button type="button" disabled={loading} on:click={useIp} class="flex min-h-[48px] items-center justify-center rounded-2xl border-2 border-linea bg-white font-black text-negro disabled:opacity-50">
            🌐 Aproximar por IP (sin sensores)
          </button>
          {#if allowManual}
            <button type="button" class="min-h-[44px] text-sm font-extrabold text-gris underline" on:click={() => (step = 'manual')}>Elegir una ciudad manualmente</button>
          {/if}
        </div>
      {:else if step === 'ip_fallback'}
        <div class="flex flex-col gap-2">
          <p class="text-sm font-semibold text-gris">Si el GPS no está disponible, podemos ubicar tu zona aproximada por tu conexión a internet.</p>
          <button type="button" disabled={loading} on:click={useIp} class="flex min-h-[52px] items-center justify-center rounded-2xl bg-petroleo font-black text-white disabled:opacity-50">
            {loading ? 'Aproximando…' : '🌐 Aproximar por IP'}
          </button>
          {#if allowManual}
            <button type="button" class="flex min-h-[48px] items-center justify-center rounded-2xl border-2 border-linea bg-white font-black" on:click={() => (step = 'manual')}>Elegir ciudad manualmente</button>
          {/if}
          <button type="button" class="min-h-[44px] text-sm font-extrabold text-gris underline" on:click={() => (step = 'prompt')}>Volver</button>
        </div>
      {:else}
        <div class="flex flex-col gap-2">
          <p class="text-sm font-semibold text-gris">Selecciona una ciudad para ubicar tu zona sin usar GPS ni IP.</p>
          <div class="grid max-h-64 grid-cols-2 gap-2 overflow-auto pr-1">
            {#each CITY_PRESETS as preset (preset.id || preset.name)}
              <button type="button" class="rounded-2xl border-2 border-linea bg-white p-3 text-left hover:border-petroleo" on:click={() => choosePreset(preset)}>
                <div class="font-black">{preset.name}</div>
                <div class="text-xs font-semibold text-gris">{preset.country}</div>
              </button>
            {/each}
          </div>
          <button type="button" class="min-h-[44px] text-sm font-extrabold text-gris underline" on:click={() => (step = 'prompt')}>← Volver a opciones automáticas</button>
        </div>
      {/if}
    </div>
  </div>
{/if}
