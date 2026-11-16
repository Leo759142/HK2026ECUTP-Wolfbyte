<script lang="ts">
  import type { Category, POI, SortOption, UserLocation } from '../types/poi';
  import { CATEGORIES_CONFIG } from '../types/poi';
  import { formatDistance, getCardinalBearing, getDirectionsUrl } from '../utils/distance';
  import RatingStars from './RatingStars.svelte';
  import { 
    ArrowUpDown, 
    Compass, 
    Heart, 
    MapPin, 
    Navigation, 
    Pencil, 
    Search, 
    Share2, 
    Trash2, 
    Plus 
  } from 'lucide-svelte';

  export let pois: POI[] = [];
  export let selectedPoi: POI | null = null;
  export let selectedCategory: Category | 'all' = 'all';
  export let searchQuery: string = '';
  export let sortBy: SortOption = 'distance';
  export let onlyFavorites: boolean = false;
  export let userLocation: UserLocation | null = null;

  export let onSelectPoi: (poi: POI) => void;
  export let onSelectCategory: (cat: Category | 'all') => void;
  export let onSearchChange: (q: string) => void;
  export let onSortChange: (sort: SortOption) => void;
  export let onToggleFavoritesOnly: () => void;
  export let onToggleFavorite: (id: string) => void;
  export let onEditPoi: (poi: POI) => void;
  export let onDeletePoi: (id: string) => void;
  export let onSharePoi: (poi: POI) => void;
  export let onOpenCreate: () => void;
</script>

<div class="flex flex-col h-full bg-slate-900 border-l border-slate-800 overflow-hidden">
  <!-- Barra de Búsqueda y Filtros Superiores -->
  <div class="p-3.5 border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-md flex flex-col gap-2.5">
    <div class="flex items-center gap-2">
      <div class="relative flex-1">
        <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, comida, wifi..."
          value={searchQuery}
          on:input={(e) => onSearchChange(e.currentTarget.value)}
          class="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 focus:border-blue-500 focus:outline-none text-xs text-white placeholder-slate-400 transition"
        />
      </div>

      <button
        on:click={onOpenCreate}
        class="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1 shadow-lg shadow-blue-600/25 shrink-0 transition active:scale-95"
        title="Nuevo punto de interés"
      >
        <Plus class="w-4 h-4" />
        <span class="hidden sm:inline">Nuevo</span>
      </button>
    </div>

    <!-- Fila de controles: Ordenar y Favoritos -->
    <div class="flex items-center justify-between text-xs gap-2">
      <div class="flex items-center gap-1.5 text-slate-400">
        <ArrowUpDown class="w-3.5 h-3.5 text-blue-400" />
        <select
          value={sortBy}
          on:change={(e) => onSortChange(e.currentTarget.value as SortOption)}
          class="bg-slate-800 border border-slate-700/80 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none"
        >
          <option value="distance">Distancia (Haversine)</option>
          <option value="rating">Mejor Calificados</option>
          <option value="newest">Más Recientes</option>
          <option value="name">Alfabético (A-Z)</option>
        </select>
      </div>

      <button
        on:click={onToggleFavoritesOnly}
        class="px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 transition {onlyFavorites ? 'bg-rose-500/20 border-rose-500/50 text-rose-300' : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'}"
      >
        <Heart class="w-3.5 h-3.5 {onlyFavorites ? 'fill-rose-500 text-rose-500' : ''}" />
        <span>Favoritos</span>
      </button>
    </div>

    <!-- Chips de Categorías deslizables -->
    <div class="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
      <button
        on:click={() => onSelectCategory('all')}
        class="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition {selectedCategory === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700/80'}"
      >
        Todos
      </button>
      {#each Object.keys(CATEGORIES_CONFIG) as catKey}
        {@const config = CATEGORIES_CONFIG[catKey]}
        {@const isSelected = selectedCategory === catKey}
        <button
          on:click={() => onSelectCategory(catKey)}
          class="px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition {isSelected ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'}"
        >
          <span>{config.emoji}</span>
          <span>{config.label.split(' ')[0]}</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Lista de Lugares -->
  <div class="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
    {#if pois.length === 0}
      <div class="flex flex-col items-center justify-center p-8 text-center text-slate-400 my-auto">
        <div class="w-14 h-14 rounded-2xl bg-slate-800/60 flex items-center justify-center text-2xl mb-3">
          🔍
        </div>
        <h4 class="font-bold text-slate-200 text-sm mb-1">Sin lugares encontrados</h4>
        <p class="text-xs text-slate-400 max-w-xs mb-4">
          No hay puntos de interés que coincidan con tus filtros actuales o búsqueda.
        </p>
        <button
          on:click={() => {
            onSelectCategory('all');
            onSearchChange('');
          }}
          class="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
        >
          Restablecer filtros
        </button>
      </div>
    {:else}
      {#each pois as poi (poi.id)}
        {@const config = CATEGORIES_CONFIG[poi.category] || CATEGORIES_CONFIG.service}
        {@const isSelected = selectedPoi?.id === poi.id}
        {@const directions = getDirectionsUrl(poi.coords, poi.name)}
        {@const bearing = userLocation && poi.distance !== undefined ? getCardinalBearing(userLocation.coords, poi.coords) : null}

        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
        <article
          on:click={() => onSelectPoi(poi)}
          class="p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 relative group {isSelected ? 'bg-slate-800/95 border-blue-500/80 shadow-lg shadow-blue-950/40 ring-1 ring-blue-500' : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'}"
        >
          <!-- Cabecera del ítem -->
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2">
              <div
                class="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 border"
                style="background-color: {config.color}20; border-color: {config.color}50;"
              >
                {config.emoji}
              </div>
              <div>
                <h4 class="font-bold text-sm text-white group-hover:text-blue-300 transition line-clamp-1">
                  {poi.name}
                </h4>
                <span class="text-[10px] uppercase font-bold text-slate-400">
                  {config.label}
                </span>
              </div>
            </div>

            <button
              on:click|stopPropagation={() => onToggleFavorite(poi.id)}
              class="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 transition"
              title={poi.isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
            >
              <Heart class="w-4 h-4 {poi.isFavorite ? 'fill-rose-500 text-rose-500' : ''}" />
            </button>
          </div>

          <!-- Descripción -->
          {#if poi.description}
            <p class="text-xs text-slate-300 line-clamp-2 leading-relaxed">
              {poi.description}
            </p>
          {/if}

          <!-- Dirección -->
          {#if poi.address}
            <div class="flex items-center gap-1 text-[11px] text-slate-400 truncate">
              <MapPin class="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span class="truncate">{poi.address}</span>
            </div>
          {/if}

          <!-- Etiquetas -->
          {#if poi.tags && poi.tags.length > 0}
            <div class="flex flex-wrap gap-1 mt-0.5">
              {#each poi.tags.slice(0, 3) as tag}
                <span class="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-700/60 text-slate-300">
                  #{tag}
                </span>
              {/each}
              {#if poi.tags.length > 3}
                <span class="text-[10px] text-slate-400">+{poi.tags.length - 3}</span>
              {/if}
            </div>
          {/if}

          <!-- Métricas: Distancia y Rating -->
          <div class="flex items-center justify-between pt-2 border-t border-slate-700/50 mt-1 text-xs">
            <div class="flex items-center gap-2">
              {#if poi.distance !== undefined}
                <div class="flex items-center gap-1 font-semibold text-emerald-400">
                  <Navigation class="w-3 h-3 rotate-45" />
                  <span>{formatDistance(poi.distance)}</span>
                  {#if bearing}
                    <span class="text-[10px] text-slate-400 font-mono">({bearing})</span>
                  {/if}
                </div>
              {/if}
              <div class="flex items-center">
                <RatingStars rating={poi.rating} size="xs" showNumber={true} />
              </div>
            </div>

            <!-- Acciones Rápidas -->
            <div class="flex items-center gap-1">
              <a
                href={directions.osm}
                target="_blank"
                rel="noopener noreferrer"
                on:click|stopPropagation={() => {}}
                class="p-1.5 rounded-lg bg-slate-700/70 hover:bg-blue-600 text-slate-300 hover:text-white transition"
                title="Navegar ruta en OpenStreetMap"
              >
                <Compass class="w-3.5 h-3.5" />
              </a>
              <button
                on:click|stopPropagation={() => onSharePoi(poi)}
                class="p-1.5 rounded-lg bg-slate-700/70 hover:bg-slate-600 text-slate-300 hover:text-white transition"
                title="Compartir (Web Share / Enlace)"
              >
                <Share2 class="w-3.5 h-3.5" />
              </button>
              <button
                on:click|stopPropagation={() => onEditPoi(poi)}
                class="p-1.5 rounded-lg bg-slate-700/70 hover:bg-slate-600 text-slate-300 hover:text-white transition"
                title="Editar información"
              >
                <Pencil class="w-3.5 h-3.5" />
              </button>
              <button
                on:click|stopPropagation={() => onDeletePoi(poi.id)}
                class="p-1.5 rounded-lg bg-slate-700/70 hover:bg-rose-900/60 text-slate-400 hover:text-rose-200 transition"
                title="Eliminar de mi lista"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </article>
      {/each}
    {/if}
  </div>

  <!-- Pie de lista -->
  <div class="p-2.5 px-4 border-t border-slate-800 bg-slate-900 text-[11px] text-slate-400 flex items-center justify-between">
    <span>Mostrando {pois.length} punto(s)</span>
    {#if userLocation}
      <span class="text-emerald-400 font-medium">
        ● GPS {userLocation.provider.toUpperCase()}
      </span>
    {/if}
  </div>
</div>
