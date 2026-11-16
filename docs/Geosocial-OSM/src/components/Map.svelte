<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import L from 'leaflet';
  import type { Coordinates, POI, UserLocation } from '../types/poi';
  import { CATEGORIES_CONFIG } from '../types/poi';
  import { formatDistance, getDirectionsUrl } from '../utils/distance';
  import { Compass, Eye, Layers, LocateFixed, MapPin } from 'lucide-svelte';

  export let userLocation: UserLocation | null = null;
  export let pois: POI[] = [];
  export let selectedPoi: POI | null = null;
  export let tempCoords: Coordinates | null = null;
  export let onMapClick: (coords: Coordinates) => void;
  export let onSelectPoi: (poi: POI | null) => void;
  export let onEditPoi: (poi: POI) => void;
  export let onDeletePoi: (id: string) => void;
  export let onSharePoi: (poi: POI) => void;

  type TileProvider = 'osm' | 'voyager' | 'dark';

  let mapContainer: HTMLDivElement;
  let mapInstance: L.Map | null = null;
  let markersLayer: L.LayerGroup | null = null;
  let userLayer: L.LayerGroup | null = null;
  let tempMarker: L.Marker | null = null;
  let tileLayer: L.TileLayer | null = null;

  let activeTile: TileProvider = 'voyager';
  let showTileMenu = false;

  function getTile(provider: TileProvider): L.TileLayer {
    if (provider === 'osm') {
      return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      });
    }
    if (provider === 'dark') {
      return L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> | &copy; OpenStreetMap',
      });
    }
    return L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> | &copy; OpenStreetMap',
    });
  }

  onMount(() => {
    if (!mapContainer) return;

    const initialCenter: [number, number] = userLocation
      ? [userLocation.coords.lat, userLocation.coords.lng]
      : [-12.046374, -77.042793];

    mapInstance = L.map(mapContainer, {
      center: initialCenter,
      zoom: 14,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

    tileLayer = getTile(activeTile);
    tileLayer.addTo(mapInstance);

    markersLayer = L.layerGroup().addTo(mapInstance);
    userLayer = L.layerGroup().addTo(mapInstance);

    mapInstance.on('click', (e: L.LeafletMouseEvent) => {
      onMapClick({
        lat: Math.round(e.latlng.lat * 1000000) / 1000000,
        lng: Math.round(e.latlng.lng * 1000000) / 1000000,
      });
    });

    renderUser();
    renderMarkers();

    setTimeout(() => {
      mapInstance?.invalidateSize();
    }, 250);
  });

  onDestroy(() => {
    if (mapInstance) {
      mapInstance.remove();
      mapInstance = null;
    }
  });

  function changeTile(provider: TileProvider) {
    if (!mapInstance) return;
    activeTile = provider;
    showTileMenu = false;
    if (tileLayer) {
      mapInstance.removeLayer(tileLayer);
    }
    tileLayer = getTile(activeTile);
    tileLayer.addTo(mapInstance);
  }

  function renderUser() {
    if (!userLayer || !mapInstance) return;
    userLayer.clearLayers();

    if (userLocation) {
      const { lat, lng, accuracy } = userLocation.coords;

      const userIcon = L.divIcon({
        className: 'user-marker-wrapper',
        html: `
          <div class="user-pulse-marker">
            <div class="user-pulse-pin"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const userMarker = L.marker([lat, lng], {
        icon: userIcon,
        zIndexOffset: 1000,
      }).addTo(userLayer);

      const providerLabel =
        userLocation.provider === 'gps'
          ? '🛰️ GPS de Alta Precisión'
          : userLocation.provider === 'ip'
            ? '🌐 Estimación por Red IP'
            : '📍 Ubicación Seleccionada';

      userMarker.bindPopup(`
        <div class="p-3 text-slate-100 min-w-[200px]">
          <div class="flex items-center gap-2 mb-1.5">
            <span class="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
            <span class="font-bold text-sm text-blue-400">Tu Posición</span>
          </div>
          <div class="text-xs text-slate-300 font-medium mb-1">${providerLabel}</div>
          <div class="text-[11px] font-mono text-slate-400">${lat.toFixed(5)}, ${lng.toFixed(5)}</div>
          ${accuracy ? `<div class="text-[11px] text-slate-400 mt-1">Margen: ±${accuracy}m</div>` : ''}
          ${userLocation.city ? `<div class="text-xs text-slate-200 mt-1 font-semibold">${userLocation.city}${userLocation.country ? `, ${userLocation.country}` : ''}</div>` : ''}
        </div>
      `);

      if (accuracy && accuracy > 30) {
        L.circle([lat, lng], {
          radius: Math.min(accuracy, 15000),
          color: '#3b82f6',
          weight: 1.5,
          opacity: 0.5,
          fillColor: '#3b82f6',
          fillOpacity: 0.1,
        }).addTo(userLayer);
      }
    }
  }

  function renderMarkers() {
    if (!markersLayer || !mapInstance) return;
    markersLayer.clearLayers();

    pois.forEach((poi) => {
      const config = CATEGORIES_CONFIG[poi.category] || CATEGORIES_CONFIG.service;
      const isCurrentSelected = selectedPoi?.id === poi.id;

      const customIcon = L.divIcon({
        className: 'poi-custom-pin-wrapper',
        html: `
          <div class="poi-bubble-marker ${isCurrentSelected ? 'ring-4 ring-white ring-offset-2 scale-110' : ''}" style="background-color: ${config.color};">
            <span class="poi-bubble-emoji">${config.emoji}</span>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -36],
      });

      const marker = L.marker([poi.coords.lat, poi.coords.lng], {
        icon: customIcon,
      }).addTo(markersLayer!);

      const directions = getDirectionsUrl(poi.coords, poi.name);
      const ratingFormatted = (poi.rating || 5).toFixed(1);
      const safeReviewCount = poi.reviewsCount || poi.reviews?.length || 1;

      const popupHtml = document.createElement('div');
      popupHtml.className = 'p-3 text-slate-100 min-w-[250px] max-w-[290px]';
      popupHtml.innerHTML = `
        <div class="flex items-start justify-between gap-2 mb-1.5">
          <h4 class="font-bold text-sm text-white line-clamp-1">${poi.name}</h4>
          <span class="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded text-white" style="background-color: ${config.color};">${config.label.split(' ')[0]}</span>
        </div>
        <p class="text-xs text-slate-300 mb-2 line-clamp-2">${poi.description || 'Sin descripción adicional'}</p>
        <div class="flex items-center justify-between text-xs mb-2 bg-slate-800/80 p-1.5 rounded-lg border border-slate-700/60">
          <div class="flex items-center gap-1 text-amber-400 font-bold font-mono">
            <span>⭐</span>
            <span>${ratingFormatted}</span>
            <span class="text-[10px] text-slate-400 font-normal">(${safeReviewCount} reseñas)</span>
          </div>
          <span class="text-emerald-400 font-mono text-[11px] font-semibold">${formatDistance(poi.distance)}</span>
        </div>
        ${poi.address ? `<div class="text-[11px] text-slate-400 mb-2 truncate">📍 ${poi.address}</div>` : ''}
        
        <button id="popup-view-internal-${poi.id}" class="w-full mb-2 py-1.5 px-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95">
          <span>🔍 Ver Ficha Completa (Popup Interno)</span>
        </button>

        <div class="flex items-center gap-1.5 pt-2 border-t border-slate-700/60">
          <a href="${directions.osm}" target="_blank" rel="noopener noreferrer" class="flex-1 text-center py-1.5 px-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-[11px] font-medium flex items-center justify-center gap-1">
            <span>Ruta OSM</span>
          </a>
          <button id="popup-share-${poi.id}" class="py-1.5 px-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-[11px]" title="Compartir">
            🔗
          </button>
          <button id="popup-edit-${poi.id}" class="py-1.5 px-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-[11px]" title="Editar">
            ✏️
          </button>
          <button id="popup-del-${poi.id}" class="py-1.5 px-2.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 rounded text-[11px]" title="Eliminar">
            🗑️
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        onSelectPoi(poi);
      });

      marker.on('popupopen', () => {
        const viewInternalBtn = document.getElementById(`popup-view-internal-${poi.id}`);
        const shareBtn = document.getElementById(`popup-share-${poi.id}`);
        const editBtn = document.getElementById(`popup-edit-${poi.id}`);
        const delBtn = document.getElementById(`popup-del-${poi.id}`);

        if (viewInternalBtn) viewInternalBtn.onclick = () => onSelectPoi(poi);
        if (shareBtn) shareBtn.onclick = () => onSharePoi(poi);
        if (editBtn) editBtn.onclick = () => onEditPoi(poi);
        if (delBtn) delBtn.onclick = () => onDeletePoi(poi.id);
      });
    });
  }

  // Actualizaciones reactivas
  $: if (mapInstance && userLocation) {
    renderUser();
  }

  $: if (mapInstance && pois) {
    renderMarkers();
  }

  $: if (mapInstance && tempCoords !== undefined) {
    if (tempMarker) {
      tempMarker.remove();
      tempMarker = null;
    }
    if (tempCoords) {
      const tempIcon = L.divIcon({
        className: 'temp-marker-icon',
        html: `
          <div class="w-8 h-8 rounded-full bg-amber-500 text-slate-900 border-2 border-white shadow-xl flex items-center justify-center animate-bounce font-bold text-base">
            ➕
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });
      tempMarker = L.marker([tempCoords.lat, tempCoords.lng], { icon: tempIcon }).addTo(mapInstance);
    }
  }

  $: if (mapInstance && selectedPoi) {
    mapInstance.flyTo([selectedPoi.coords.lat, selectedPoi.coords.lng], 16, { duration: 1 });
  }

  function handleCenterUser() {
    if (!mapInstance || !userLocation) return;
    mapInstance.flyTo([userLocation.coords.lat, userLocation.coords.lng], 15, { duration: 1 });
  }

  function handleFitAll() {
    if (!mapInstance) return;
    const allCoords: [number, number][] = pois.map((p) => [p.coords.lat, p.coords.lng]);
    if (userLocation) {
      allCoords.push([userLocation.coords.lat, userLocation.coords.lng]);
    }
    if (allCoords.length > 0) {
      mapInstance.fitBounds(L.latLngBounds(allCoords), {
        padding: [50, 50],
        maxZoom: 16,
      });
    }
  }
</script>

<div class="relative w-full h-full min-h-[350px] bg-slate-950 overflow-hidden select-none">
  <div bind:this={mapContainer} class="w-full h-full z-0"></div>

  <!-- Botones de control sobre el mapa -->
  <div class="absolute top-4 right-4 z-[400] flex flex-col gap-2">
    {#if userLocation}
      <button
        on:click={handleCenterUser}
        title="Centrar en mi posición actual"
        class="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-blue-400 border border-slate-700/80 shadow-lg backdrop-blur-md transition-all active:scale-95 flex items-center justify-center"
      >
        <LocateFixed class="w-5 h-5" />
      </button>
    {/if}

    <button
      on:click={handleFitAll}
      title="Ver todos los puntos en el mapa"
      class="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-lg backdrop-blur-md transition-all active:scale-95 flex items-center justify-center"
    >
      <Eye class="w-5 h-5" />
    </button>

    <div class="relative">
      <button
        on:click={() => (showTileMenu = !showTileMenu)}
        title="Cambiar estilo de mapa OpenStreetMap"
        class="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-lg backdrop-blur-md transition-all active:scale-95 flex items-center justify-center"
      >
        <Layers class="w-5 h-5" />
      </button>

      {#if showTileMenu}
        <div class="absolute right-0 top-12 w-44 rounded-xl bg-slate-900/95 border border-slate-700 shadow-2xl p-2 z-50 backdrop-blur-lg flex flex-col gap-1">
          <span class="text-[11px] font-semibold text-slate-400 px-2 py-1">Estilo de mapa:</span>
          <button
            on:click={() => changeTile('voyager')}
            class="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between {activeTile === 'voyager' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}"
          >
            <span>Carto Voyager</span>
            {#if activeTile === 'voyager'}<span class="text-[10px]">✓</span>{/if}
          </button>
          <button
            on:click={() => changeTile('osm')}
            class="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between {activeTile === 'osm' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}"
          >
            <span>OSM Estándar</span>
            {#if activeTile === 'osm'}<span class="text-[10px]">✓</span>{/if}
          </button>
          <button
            on:click={() => changeTile('dark')}
            class="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between {activeTile === 'dark' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}"
          >
            <span>Carto Dark</span>
            {#if activeTile === 'dark'}<span class="text-[10px]">✓</span>{/if}
          </button>
        </div>
      {/if}
    </div>
  </div>

  <div class="absolute top-4 left-4 z-[400] pointer-events-none">
    <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-md border border-slate-700/60 text-xs text-slate-300 shadow-lg">
      <MapPin class="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span>Haz clic en el mapa para marcar un nuevo local</span>
    </div>
  </div>
</div>
