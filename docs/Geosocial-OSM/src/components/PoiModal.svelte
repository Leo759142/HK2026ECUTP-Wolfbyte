<script lang="ts">
  import type { Category, Coordinates, POI, UserLocation } from '../types/poi';
  import { CATEGORIES_CONFIG } from '../types/poi';
  import { GeoLocationService } from '../services/geoService';
  import RatingStars from './RatingStars.svelte';
  import { Loader2, MapPin, Sparkles, X } from 'lucide-svelte';

  export let isOpen: boolean = false;
  export let mode: 'create' | 'edit' = 'create';
  export let initialPoi: POI | null = null;
  export let initialCoords: Coordinates | null = null;
  export let userLocation: UserLocation | null = null;
  export let onClose: () => void;
  export let onSave: (poiData: Omit<POI, 'id' | 'createdAt'>) => void;

  let name = '';
  let category: Category = 'food';
  let description = '';
  let address = '';
  let rating = 5;
  let tagsInput = '';
  let isFavorite = false;
  let coords: Coordinates = { lat: 0, lng: 0 };
  let isReverseGeocoding = false;

  $: if (isOpen) {
    if (mode === 'edit' && initialPoi) {
      name = initialPoi.name;
      category = initialPoi.category;
      description = initialPoi.description;
      address = initialPoi.address || '';
      rating = initialPoi.rating || 5;
      tagsInput = initialPoi.tags?.join(', ') || '';
      isFavorite = initialPoi.isFavorite || false;
      coords = { ...initialPoi.coords };
    } else {
      name = '';
      category = 'food';
      description = '';
      address = '';
      rating = 5;
      tagsInput = '';
      isFavorite = false;
      if (initialCoords) {
        coords = { ...initialCoords };
        resolveAddress(initialCoords.lat, initialCoords.lng);
      } else if (userLocation) {
        coords = { ...userLocation.coords };
        resolveAddress(userLocation.coords.lat, userLocation.coords.lng);
      } else {
        coords = { lat: -12.046374, lng: -77.042793 };
      }
    }
  }

  async function resolveAddress(lat: number, lng: number) {
    isReverseGeocoding = true;
    try {
      const res = await GeoLocationService.reverseGeocode(lat, lng);
      if (res && res.fullAddress) {
        address = res.name || res.fullAddress.split(',')[0];
      }
    } catch {
      // Ignorar error
    } finally {
      isReverseGeocoding = false;
    }
  }

  function handleSubmit() {
    if (!name.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t: string) => t.trim().toLowerCase())
      .filter((t: string) => t.length > 0);

    onSave({
      name: name.trim(),
      category,
      description: description.trim(),
      address: address.trim(),
      coords,
      rating,
      reviewsCount: mode === 'edit' && initialPoi ? initialPoi.reviewsCount : 1,
      tags,
      isFavorite,
    });
    onClose();
  }

  function handleUseUserLocation() {
    if (userLocation) {
      coords = { ...userLocation.coords };
      resolveAddress(userLocation.coords.lat, userLocation.coords.lng);
    }
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
    <div class="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 text-slate-100 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <div class="flex items-center gap-2">
          <span class="text-xl">
            {mode === 'create' ? '📍' : '✏️'}
          </span>
          <h3 class="font-bold text-lg text-white">
            {mode === 'create' ? 'Nuevo Punto de Interés (POI)' : 'Editar Local'}
          </h3>
        </div>
        <button
          on:click={onClose}
          class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <form on:submit|preventDefault={handleSubmit} class="flex flex-col gap-4 text-xs">
        <!-- Nombre -->
        <div class="flex flex-col gap-1.5">
          <label for="poi-name" class="font-semibold text-slate-300">
            Nombre del local o punto <span class="text-rose-400">*</span>
          </label>
          <input
            id="poi-name"
            type="text"
            required
            placeholder="Ej. Café & Bakery Don Pepe"
            bind:value={name}
            class="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-blue-500 focus:outline-none text-white text-sm"
          />
        </div>

        <!-- Categoría -->
        <div class="flex flex-col gap-1.5">
          <span class="font-semibold text-slate-300">Categoría</span>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {#each Object.keys(CATEGORIES_CONFIG) as catKey}
              {@const item = CATEGORIES_CONFIG[catKey]}
              {@const isSelected = category === catKey}
              <button
                type="button"
                on:click={() => (category = catKey)}
                class="py-2 px-2.5 rounded-xl border text-left flex items-center gap-2 transition {isSelected ? 'border-blue-500 bg-blue-500/20 text-white font-semibold' : 'border-slate-700/80 bg-slate-800/50 text-slate-300 hover:bg-slate-800'}"
              >
                <span>{item.emoji}</span>
                <span class="truncate">{item.label.split(' ')[0]}</span>
              </button>
            {/each}
          </div>
        </div>

        <!-- Coordenadas -->
        <div class="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <span class="font-semibold text-slate-300 flex items-center gap-1">
              <MapPin class="w-3.5 h-3.5 text-blue-400" />
              Coordenadas Geográficas (OSM)
            </span>
            {#if userLocation}
              <button
                type="button"
                on:click={handleUseUserLocation}
                class="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
              >
                Usar mi ubicación
              </button>
            {/if}
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label for="poi-lat" class="text-[10px] text-slate-400">Latitud</label>
              <input
                id="poi-lat"
                type="number"
                step="any"
                bind:value={coords.lat}
                class="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 font-mono text-xs text-white"
              />
            </div>
            <div>
              <label for="poi-lng" class="text-[10px] text-slate-400">Longitud</label>
              <input
                id="poi-lng"
                type="number"
                step="any"
                bind:value={coords.lng}
                class="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 font-mono text-xs text-white"
              />
            </div>
          </div>
        </div>

        <!-- Dirección y autocompletar OSM -->
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between">
            <label for="poi-address" class="font-semibold text-slate-300">Dirección o Referencia</label>
            <button
              type="button"
              on:click={() => resolveAddress(coords.lat, coords.lng)}
              disabled={isReverseGeocoding}
              class="text-[11px] text-blue-400 hover:underline flex items-center gap-1 disabled:opacity-50"
            >
              {#if isReverseGeocoding}
                <Loader2 class="w-3 h-3 animate-spin" />
              {:else}
                <Sparkles class="w-3 h-3" />
              {/if}
              <span>Auto-obtener vía OSM</span>
            </button>
          </div>
          <input
            id="poi-address"
            type="text"
            placeholder="Ej. Av. Primavera 123"
            bind:value={address}
            class="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-blue-500 focus:outline-none text-white text-xs"
          />
        </div>

        <!-- Descripción -->
        <div class="flex flex-col gap-1.5">
          <label for="poi-desc" class="font-semibold text-slate-300">Descripción o reseña social</label>
          <textarea
            id="poi-desc"
            rows="2"
            placeholder="¿Qué ofrece este lugar? Especialidades, ambiente, horarios..."
            bind:value={description}
            class="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-blue-500 focus:outline-none text-white text-xs resize-none"
          ></textarea>
        </div>

        <!-- Calificación y Favorito -->
        <div class="grid grid-cols-2 gap-4 items-center">
          <div class="flex flex-col gap-1">
            <span class="font-semibold text-slate-300">Valoración</span>
            <div class="flex items-center gap-2">
              <RatingStars
                rating={rating}
                size="md"
                interactive={true}
                onRatingChange={(newVal) => (rating = newVal)}
                showNumber={true}
              />
            </div>
          </div>

          <div class="flex items-center gap-2 pt-3">
            <label class="cursor-pointer flex items-center gap-2 text-slate-300">
              <input
                type="checkbox"
                bind:checked={isFavorite}
                class="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
              />
              <span class="font-semibold">Guardar en Favoritos ❤️</span>
            </label>
          </div>
        </div>

        <!-- Tags -->
        <div class="flex flex-col gap-1.5">
          <label for="poi-tags" class="font-semibold text-slate-300">Etiquetas (separadas por comas)</label>
          <input
            id="poi-tags"
            type="text"
            placeholder="wifi, terraza, comida vegana, 24 horas..."
            bind:value={tagsInput}
            class="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-blue-500 focus:outline-none text-white text-xs"
          />
        </div>

        <!-- Botones de acción -->
        <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            on:click={onClose}
            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition shadow-lg shadow-blue-600/30"
          >
            {mode === 'create' ? 'Guardar POI' : 'Actualizar Cambios'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
