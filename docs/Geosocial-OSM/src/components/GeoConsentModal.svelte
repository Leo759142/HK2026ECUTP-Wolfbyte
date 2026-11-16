<script lang="ts">
  import { CITY_PRESETS, GeoLocationService } from '../services/geoService';
  import type { UserLocation } from '../types/poi';
  import { AlertCircle, CheckCircle2, Globe, LocateFixed, MapPin, ShieldCheck, X } from 'lucide-svelte';

  export let isOpen: boolean = false;
  export let onClose: () => void;
  export let onLocationResolved: (location: UserLocation) => void;
  export let initialError: string | null = null;

  let step: 'prompt' | 'ip_fallback' | 'manual' = 'prompt';
  let loading = false;
  let errorMessage: string | null = initialError;

  $: if (initialError) {
    errorMessage = initialError;
  }

  async function handleRequestGps() {
    loading = true;
    errorMessage = null;
    try {
      const loc = await GeoLocationService.getGpsLocation();
      onLocationResolved(loc);
      onClose();
    } catch (err: any) {
      errorMessage = err.message || 'No se pudo obtener la posición por GPS.';
      step = 'ip_fallback';
    } finally {
      loading = false;
    }
  }

  async function handleRequestIp() {
    loading = true;
    errorMessage = null;
    try {
      const loc = await GeoLocationService.getIpLocation();
      onLocationResolved(loc);
      onClose();
    } catch {
      errorMessage = 'No se pudo determinar la ubicación aproximada por IP.';
      step = 'manual';
    } finally {
      loading = false;
    }
  }

  function handleSelectCity(preset: (typeof CITY_PRESETS)[0]) {
    const loc: UserLocation = {
      coords: preset.coords,
      provider: 'manual',
      city: preset.name,
      country: preset.country,
      timestamp: Date.now(),
    };
    GeoLocationService.setCachedLocation(loc);
    onLocationResolved(loc);
    onClose();
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
    <div class="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 text-slate-100 flex flex-col gap-4 relative overflow-hidden">
      <!-- Glow de fondo -->
      <div class="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>

      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <ShieldCheck class="w-5 h-5" />
          </div>
          <div>
            <h3 class="font-bold text-base text-white">Geolocalización Permisiva</h3>
            <p class="text-xs text-slate-400">Control de Privacidad (ISO/IEC 25010)</p>
          </div>
        </div>
        <button
          on:click={onClose}
          class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      {#if errorMessage}
        <div class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
          <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      {/if}

      <!-- Paso 1: Solicitud inicial explicada -->
      {#if step === 'prompt'}
        <div class="flex flex-col gap-3">
          <p class="text-sm text-slate-300 leading-relaxed">
            Para calcular distancias exactas con la <strong>fórmula de Haversine</strong> y ordenar
            comercios desde el más cercano, la aplicación necesita tu ubicación.
          </p>
          <div class="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs text-slate-300 flex flex-col gap-1.5">
            <div class="flex items-center gap-2 text-emerald-400 font-semibold">
              <CheckCircle2 class="w-4 h-4" />
              <span>Privacidad garantizada</span>
            </div>
            <p class="text-slate-400">
              Tus coordenadas se procesan 100% de forma local en tu navegador. No se almacenan en servidores externos.
            </p>
          </div>

          <div class="flex flex-col gap-2 pt-2">
            <button
              on:click={handleRequestGps}
              disabled={loading}
              class="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-[0.98] transition"
            >
              <LocateFixed class="w-4 h-4" />
              <span>{loading ? 'Consultando sensor...' : 'Activar GPS de alta precisión'}</span>
            </button>

            <button
              on:click={handleRequestIp}
              disabled={loading}
              class="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-2 border border-slate-700 transition"
            >
              <Globe class="w-4 h-4 text-blue-400" />
              <span>Solo aproximar por red IP (Sin sensores)</span>
            </button>

            <button
              on:click={() => (step = 'manual')}
              class="w-full py-2 px-3 text-xs text-slate-400 hover:text-slate-200 transition"
            >
              O elegir una ciudad manualmente...
            </button>
          </div>
        </div>
      {:else if step === 'ip_fallback'}
        <div class="flex flex-col gap-3">
          <p class="text-sm text-slate-300 leading-relaxed">
            El acceso GPS no estuvo disponible o fue denegado. Puedes usar la estimación aproximada por tu proveedor de Internet (IP pública).
          </p>
          <div class="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-300">
            📍 Ubica tu ciudad y distrito con un margen aproximado de ~5-10 km, ideal para explorar sin activar sensores físicos.
          </div>

          <div class="flex flex-col gap-2 pt-2">
            <button
              on:click={handleRequestIp}
              disabled={loading}
              class="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-[0.98] transition"
            >
              <Globe class="w-4 h-4" />
              <span>{loading ? 'Conectando con IP...' : 'Aproximar por dirección IP'}</span>
            </button>

            <button
              on:click={() => (step = 'manual')}
              class="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700 transition"
            >
              Elegir ciudad de la lista
            </button>
          </div>
        </div>
      {:else if step === 'manual'}
        <div class="flex flex-col gap-3">
          <p class="text-xs text-slate-300">
            Selecciona una ciudad para centrar el mapa y calcular distancias simuladas:
          </p>
          <div class="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {#each CITY_PRESETS as preset}
              <button
                on:click={() => handleSelectCity(preset)}
                class="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-left transition flex flex-col gap-0.5 active:scale-95"
              >
                <span class="font-semibold text-xs text-white flex items-center gap-1">
                  <MapPin class="w-3 h-3 text-amber-400" />
                  {preset.name}
                </span>
                <span class="text-[10px] text-slate-400">{preset.country}</span>
              </button>
            {/each}
          </div>
          <button
            on:click={() => (step = 'prompt')}
            class="text-xs text-slate-400 hover:text-white mt-1"
          >
            ← Volver a opciones automáticas
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}
