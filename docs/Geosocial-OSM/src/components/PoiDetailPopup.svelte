<script lang="ts">
  import type { POI, Review, UserLocation } from '../types/poi';
  import { CATEGORIES_CONFIG } from '../types/poi';
  import { formatDistance, getCardinalBearing, getDirectionsUrl } from '../utils/distance';
  import RatingStars from './RatingStars.svelte';
  import { 
    Check, 
    Compass, 
    Copy, 
    ExternalLink, 
    Heart, 
    MapPin, 
    MessageSquare, 
    Navigation, 
    Pencil, 
    Send, 
    Share2, 
    Trash2, 
    X 
  } from 'lucide-svelte';

  export let poi: POI | null = null;
  export let userLocation: UserLocation | null = null;
  export let onClose: () => void;
  export let onEdit: (poi: POI) => void;
  export let onDelete: (id: string) => void;
  export let onShare: (poi: POI) => void;
  export let onToggleFavorite: (id: string) => void;
  export let onAddReview: (poiId: string, review: Omit<Review, 'id' | 'date'>) => void;

  let activeTab: 'info' | 'reviews' = 'info';
  let copiedCoords = false;
  let newReviewAuthor = '';
  let newReviewRating = 5;
  let newReviewComment = '';
  let isSubmittingReview = false;

  $: config = poi ? (CATEGORIES_CONFIG[poi.category] || CATEGORIES_CONFIG.service) : CATEGORIES_CONFIG.service;
  $: directions = poi ? getDirectionsUrl(poi.coords, poi.name) : { osm: '', gmaps: '' };
  $: bearing = userLocation && poi && poi.distance !== undefined
    ? getCardinalBearing(userLocation.coords, poi.coords)
    : null;

  $: reviewsList = (poi && poi.reviews) ? poi.reviews : [
    {
      id: 'rev-def-1',
      userName: 'Camila Ríos',
      rating: poi ? Math.min(5, Math.max(4, Math.round(poi.rating))) : 5,
      comment: '¡Excelente lugar! Muy buena atención y la ubicación es muy accesible.',
      date: 'Hace 2 días',
    },
    {
      id: 'rev-def-2',
      userName: 'Marcos V.',
      rating: 5,
      comment: 'Recomendado al 100%. Los precios son justos y el ambiente es genial.',
      date: 'Hace 1 semana',
    },
  ];

  function handleCopyCoords() {
    if (!poi) return;
    navigator.clipboard.writeText(`${poi.coords.lat}, ${poi.coords.lng}`);
    copiedCoords = true;
    setTimeout(() => (copiedCoords = false), 2000);
  }

  function handleReviewSubmit() {
    if (!poi || !newReviewComment.trim()) return;
    isSubmittingReview = true;
    onAddReview(poi.id, {
      userName: newReviewAuthor.trim() || 'Explorador Local',
      rating: newReviewRating,
      comment: newReviewComment.trim(),
    });
    newReviewAuthor = '';
    newReviewComment = '';
    newReviewRating = 5;
    isSubmittingReview = false;
  }
</script>

{#if poi}
  <div class="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-md p-0 sm:p-4">
    <div 
      class="w-full sm:max-w-lg bg-slate-900 border border-slate-700/80 rounded-t-3xl sm:rounded-2xl shadow-2xl text-slate-100 flex flex-col max-h-[85vh] sm:max-h-[90vh] overflow-hidden"
      role="dialog"
      aria-modal="true"
    >
      <!-- Cabecera del Popup Interno -->
      <div class="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/95 flex items-start justify-between gap-3 shrink-0">
        <div class="flex items-center gap-3">
          <div
            class="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border shadow-inner"
            style="background-color: {config.color}20; border-color: {config.color}50;"
          >
            {config.emoji}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span
                class="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full text-white"
                style="background-color: {config.color};"
              >
                {config.label}
              </span>
              {#if poi.distance !== undefined}
                <span class="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                  <Navigation class="w-3 h-3 rotate-45" />
                  {formatDistance(poi.distance)} {#if bearing}({bearing}){/if}
                </span>
              {/if}
            </div>
            <h2 class="font-bold text-lg sm:text-xl text-white mt-0.5 line-clamp-1">
              {poi.name}
            </h2>
          </div>
        </div>

        <div class="flex items-center gap-1.5">
          <button
            on:click={() => poi && onToggleFavorite(poi.id)}
            class="p-2 rounded-xl transition {poi.isFavorite ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30' : 'bg-slate-800 text-slate-400 hover:text-white'}"
            title={poi.isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
          >
            <Heart class="w-5 h-5 {poi.isFavorite ? 'fill-rose-500 text-rose-500' : ''}" />
          </button>
          <button
            on:click={onClose}
            class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Pestañas internas -->
      <div class="flex items-center border-b border-slate-800 bg-slate-950/40 px-4 text-xs shrink-0">
        <button
          on:click={() => (activeTab = 'info')}
          class="py-2.5 px-3 font-semibold border-b-2 transition {activeTab === 'info' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}"
        >
          Detalles & Información
        </button>
        <button
          on:click={() => (activeTab = 'reviews')}
          class="py-2.5 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 {activeTab === 'reviews' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}"
        >
          <MessageSquare class="w-3.5 h-3.5" />
          <span>Reseñas ({reviewsList.length})</span>
        </button>
      </div>

      <!-- Contenido scrollable -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4 text-xs sm:text-sm text-slate-300">
        {#if activeTab === 'info'}
          <!-- Puntuación y Resumen -->
          <div class="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
            <div>
              <div class="text-[11px] text-slate-400 font-medium mb-1">Calificación Social</div>
              <div class="flex items-center gap-2">
                <RatingStars rating={poi.rating} size="md" showNumber={true} />
                <span class="text-xs text-slate-400">
                  &bull; {poi.reviewsCount || reviewsList.length} valoraciones
                </span>
              </div>
            </div>
            <div class="text-right">
              <span class="text-2xl font-black text-amber-400 font-mono">
                {poi.rating.toFixed(1)}
              </span>
              <span class="text-xs text-slate-400"> / 5.0</span>
            </div>
          </div>

          <!-- Descripción -->
          <div class="flex flex-col gap-1">
            <span class="font-semibold text-slate-200 text-xs">Acerca de este lugar:</span>
            <p class="text-slate-300 leading-relaxed text-xs sm:text-sm bg-slate-800/30 p-3 rounded-xl border border-slate-800">
              {poi.description || 'Sin descripción detallada disponible.'}
            </p>
          </div>

          <!-- Ubicación y Dirección -->
          <div class="flex flex-col gap-2">
            {#if poi.address}
              <div class="flex items-start gap-2 p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs">
                <MapPin class="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span class="font-semibold text-slate-200 block">Dirección:</span>
                  <span class="text-slate-300">{poi.address}</span>
                </div>
              </div>
            {/if}

            <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs font-mono">
              <div class="flex items-center gap-1.5 truncate">
                <Compass class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span class="truncate">
                  Lat: {poi.coords.lat.toFixed(5)}, Lng: {poi.coords.lng.toFixed(5)}
                </span>
              </div>
              <button
                on:click={handleCopyCoords}
                class="flex items-center gap-1 text-[11px] font-sans px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition shrink-0 ml-2"
              >
                {#if copiedCoords}
                  <Check class="w-3 h-3 text-emerald-400" />
                  <span>Copiado</span>
                {:else}
                  <Copy class="w-3 h-3" />
                  <span>Copiar Coordenadas</span>
                {/if}
              </button>
            </div>
          </div>

          <!-- Tags -->
          {#if poi.tags && poi.tags.length > 0}
            <div class="flex flex-col gap-1.5">
              <span class="text-xs font-semibold text-slate-300">Etiquetas:</span>
              <div class="flex flex-wrap gap-1.5">
                {#each poi.tags as tag}
                  <span class="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-medium">
                    #{tag}
                  </span>
                {/each}
              </div>
            </div>
          {/if}
        {:else if activeTab === 'reviews'}
          <!-- Formulario de reseña -->
          <form on:submit|preventDefault={handleReviewSubmit} class="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col gap-2.5">
            <span class="font-bold text-xs text-white">Dejar una Reseña Comunitaria:</span>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Tu nombre (opcional)"
                bind:value={newReviewAuthor}
                class="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
              />
              <div class="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700">
                <span class="text-xs text-slate-400">Puntaje:</span>
                <RatingStars
                  rating={newReviewRating}
                  size="sm"
                  interactive={true}
                  onRatingChange={(val) => (newReviewRating = val)}
                />
              </div>
            </div>
            <div class="flex gap-2">
              <input
                type="text"
                required
                placeholder="Escribe tu opinión sobre el local..."
                bind:value={newReviewComment}
                class="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={isSubmittingReview || !newReviewComment.trim()}
                class="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition"
              >
                <Send class="w-3.5 h-3.5" />
                <span class="hidden sm:inline">Publicar</span>
              </button>
            </div>
          </form>

          <!-- Lista de reseñas -->
          <div class="flex flex-col gap-2.5">
            {#each reviewsList as rev (rev.id)}
              <div class="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 flex flex-col gap-1.5">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 font-bold text-xs flex items-center justify-center">
                      {rev.userName[0]?.toUpperCase() || 'U'}
                    </div>
                    <span class="font-semibold text-xs text-slate-200">{rev.userName}</span>
                  </div>
                  <span class="text-[10px] text-slate-500">{rev.date}</span>
                </div>
                <RatingStars rating={rev.rating} size="xs" />
                <p class="text-xs text-slate-300 mt-0.5">{rev.comment}</p>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Barra de acciones inferior -->
      <div class="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between gap-2 shrink-0">
        <div class="flex items-center gap-1.5">
          <a
            href={directions.osm}
            target="_blank"
            rel="noopener noreferrer"
            class="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition active:scale-95"
          >
            <Navigation class="w-3.5 h-3.5" />
            <span>Cómo Llegar</span>
          </a>
          <a
            href={directions.gmaps}
            target="_blank"
            rel="noopener noreferrer"
            class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Abrir en Google Maps"
          >
            <ExternalLink class="w-4 h-4" />
          </a>
          <button
            on:click={() => poi && onShare(poi)}
            class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-1.5 transition active:scale-95"
            title="Compartir enlace social"
          >
            <Share2 class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Compartir</span>
          </button>
        </div>

        <div class="flex items-center gap-1.5">
          <button
            on:click={() => {
              onClose();
              if (poi) onEdit(poi);
            }}
            class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Editar"
          >
            <Pencil class="w-4 h-4" />
          </button>
          <button
            on:click={() => {
              if (poi) onDelete(poi.id);
              onClose();
            }}
            class="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-200 transition"
            title="Eliminar"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
