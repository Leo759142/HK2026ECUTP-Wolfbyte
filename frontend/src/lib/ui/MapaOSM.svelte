<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import L from 'leaflet';
  import type { Coordinates, UserLocation } from '../types/poi';
  import { LocateFixed, MapPin, Layers, Eye, AlertTriangle } from 'lucide-svelte';
  import { GeoLocationService } from '../servicios/geoService';

  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });

  let {
    userLocation = null,
    pins = [],
    selectedPinId = null,
    onPinClick = () => {},
    onMapClick = () => {},
    centerOnUser = false,
    enableTracking = false,
  } = $props<{
    userLocation: UserLocation | null;
    pins: Array<{
      id: string;
      kind: 'service' | 'favor' | 'need' | 'group' | 'me';
      lat: number;
      lng: number;
      emoji: string;
      label: string;
      cls?: string;
      onClick?: () => void;
    }>;
    selectedPinId: string | null;
    onPinClick: (id: string) => void;
    onMapClick: (coords: Coordinates) => void;
    centerOnUser: boolean;
    enableTracking: boolean;
  }>();

  let searchQuery = $state('');
  let geocodeResults = $state<Array<{ lat: number; lng: number; name: string; city?: string; country?: string }>>([]);

  let watchId: number | null = null;
  let isTracking = $state(false);
  let trackingError = $state<string | null>(null);

  let mapContainer: HTMLDivElement;
  let mapInstance: L.Map | null = null;
  let markersLayer: L.LayerGroup | null = null;
  let userLayer: L.LayerGroup | null = null;
  let accuracyCircle: L.Circle | null = null;
  let tileLayer: L.TileLayer | null = null;
  let userMarker: L.Marker | null = null;

  let activeTile = $state<'osm' | 'voyager' | 'dark'>('osm');
  let showTileMenu = $state(false);

  const DEFAULT_CENTER: [number, number] = [-12.046374, -77.042793];

  function getTile(provider: 'osm' | 'voyager' | 'dark'): L.TileLayer {
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
      : DEFAULT_CENTER;

    mapInstance = L.map(mapContainer, {
      center: initialCenter,
      zoom: 14,
      zoomControl: false,
      touchZoom: true,
      scrollWheelZoom: false,
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

    if (centerOnUser && userLocation) {
      mapInstance.setView([userLocation.coords.lat, userLocation.coords.lng], 15);
    }

    setTimeout(() => mapInstance?.invalidateSize(), 250);
  });

  onDestroy(() => {
    if (watchId !== null) {
      GeoLocationService.stopWatch(watchId);
      watchId = null;
    }
    if (mapInstance) {
      mapInstance.remove();
      mapInstance = null;
    }
  });

  function changeTile(provider: 'osm' | 'voyager' | 'dark') {
    if (!mapInstance) return;
    activeTile = provider;
    showTileMenu = false;
    if (tileLayer) mapInstance.removeLayer(tileLayer);
    tileLayer = getTile(activeTile);
    tileLayer.addTo(mapInstance);
  }

  function renderUser() {
    if (!userLayer || !mapInstance) return;
    userLayer.clearLayers();
    accuracyCircle = null;
    userMarker = null;

    if (!userLocation) return;

    const { lat, lng } = userLocation.coords;
    const acc = userLocation.coords.accuracy ?? 50;

    userMarker = L.marker([lat, lng], {
      title: 'Tú estás aquí',
      alt: 'Tu ubicación actual',
    }).addTo(userLayer);
    userMarker.bindPopup('<strong>Tú estás aquí</strong>');

    accuracyCircle = L.circle([lat, lng], {
      radius: Math.min(acc, 2000),
      color: '#2F80ED',
      fillColor: '#2F80ED',
      fillOpacity: 0.15,
      weight: 2,
      opacity: 0.6,
    }).addTo(userLayer);
    accuracyCircle.bindPopup('Zona aproximada (~100 m)');
  }

  function renderMarkers() {
    if (!markersLayer || !mapInstance) return;
    markersLayer.clearLayers();

    const clustered = clusterPins();

    for (const pin of clustered) {
      if (pin.isCluster) {
        const clusterMarker = L.marker([pin.lat, pin.lng], {
          title: pin.count + (pin.count === 1 ? " punto" : " puntos"),
          alt: pin.count + (pin.count === 1 ? " punto" : " puntos"),
          riseOnHover: true,
        });

        const iconColor = pin.kind === "need" ? "#dc2626" :
          pin.kind === "group" ? "#0891b2" :
          pin.kind === "favor" ? "#7c3aed" :
          "#0891b2";

        const icon = L.divIcon({
          className: "ayni-pin",
          html: `
            <div style="display:flex;align-items:center;justify-content:center;width:44px;height:44px;">
              <div style="
                width:44px;height:44px;
                border-radius:50% 50% 50% 0;
                background:#2F80ED;
                transform:rotate(-45deg);
                box-shadow:0 2px 8px rgba(0,0,0,0.35);
                display:flex;align-items:center;justify-content:center;
                font-size:22px;
                color:white;
                font-weight:bold;
              ">${pin.count}</div>
            </div>
          `,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
          popupAnchor: [0, -22],
        });
        clusterMarker.setIcon(icon);
        clusterMarker.bindPopup(pin.count + (pin.count === 1 ? " punto" : " puntos"), { direction: "top", offset: [0, -8] });
        clusterMarker.on("click", function() {
          onPinClick("" + pin.id);
        });
        markersLayer.addLayer(clusterMarker);
      } else {
        const isSelected = pin.id === selectedPinId;
        const marker = L.marker([pin.lat, pin.lng], {
          title: pin.label,
          alt: pin.label,
          riseOnHover: true,
        });

        const iconColor = pin.kind === "need" ? "#dc2626" :
          pin.kind === "group" ? "#0891b2" :
          pin.kind === "favor" ? "#7c3aed" :
          "#0891b2";

        const icon = L.divIcon({
          className: "ayni-pin",
          html: `
            <div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;">
              <div style="
                width:34px;height:34px;
                border-radius:50% 50% 50% 0;
                background:${iconColor};
                transform:rotate(-45deg);
                box-shadow:0 2px 4px rgba(0,0,0,0.3);
                display:flex;align-items:center;justify-content:center;
                font-size:18px;
              ">${pin.emoji}</div>
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
          popupAnchor: [0, -17],
        });
        marker.setIcon(icon);

        if (isSelected) {
          marker.openPopup();
        }

        marker.bindPopup(escapeHtml(pin.label), { direction: "top", offset: [0, -8] });
        marker.on("click", function() {
          onPinClick(pin.id);
          if (!mapInstance) return;
          mapInstance.flyTo([pin.lat, pin.lng], 16);
        });

        markersLayer.addLayer(marker);
      }
    }
  }

  function escapeHtml(text: string) {
    return text.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"');
  }

  function handleCenterUser() {
    if (!mapInstance || !userLocation) return;
    const { lat, lng } = userLocation.coords;
    mapInstance.flyTo([lat, lng], 15);
    renderUser();
  }

  function handleFitAll() {
    if (!mapInstance) return;
    const allCoords: [number, number][] = [];
    if (userLocation) {
      allCoords.push([userLocation.coords.lat, userLocation.coords.lng]);
    }
    for (const pin of pins) allCoords.push([pin.lat, pin.lng]);
    if (allCoords.length === 0) return;
    mapInstance.fitBounds(L.latLngBounds(allCoords), { padding: [60, 60], maxZoom: 16 });
  }

  function toggleTracking() {
    if (isTracking) {
      if (watchId !== null) {
        GeoLocationService.stopWatch(watchId);
        watchId = null;
      }
      isTracking = false;
      trackingError = null;
    } else {
      try {
        trackingError = null;
        watchId = GeoLocationService.watchPosition(
          (loc) => {
            userLocation = loc;
            if (userMarker && mapInstance) {
              if (mapInstance.getZoom && mapInstance.getZoom() < 15) {
                mapInstance.setView([loc.coords.lat, loc.coords.lng], 16);
              }
            }
            renderUser();
            renderMarkers();
          },
          (err) => {
            trackingError = err.message || 'Error al seguir ubicación';
            isTracking = false;
            if (watchId !== null) {
              GeoLocationService.stopWatch(watchId);
              watchId = null;
            }
          }
        );
        isTracking = true;
        trackingError = null;
      } catch (e) {
        trackingError = e ? e.message || 'No se pudo iniciar seguimiento' : 'Error desconocido';
      }
    }
  }

  async function onGeocodeSearch(query: string) {
    if (!query) return;
    try {
      const results = await GeoLocationService.geocode(query);
      geocodeResults = results;
    } catch {
      geocodeResults = [];
    }
  }

  function selectGeocodeResult(r: { lat: number; lng: number; name: string; city?: string; country?: string }) {
    userLocation = {
      coords: { lat: r.lat, lng: r.lng, accuracy: 7500 },
      provider: 'ip',
      city: r.city,
      country: r.country,
      timestamp: Date.now(),
    };
    searchQuery = '';
    geocodeResults = [];
    if (userMarker) {
      mapInstance?.setView([r.lat, r.lng], 15);
    }
    renderUser();
  }

  // Clustering: group pins that are close together (distance in approximate meters)
  function getClusterOptions() {
    if (pins.length < 8) return { enabled: false, clusterRadius: 40, clusterMinSize: 2 };
    return { enabled: true, clusterRadius: 50, clusterMinSize: 2 };
  }

  function clusterPins() {
    const { enabled, clusterRadius, clusterMinSize } = getClusterOptions();
    if (!enabled || pins.length < 8) return pins;

    const cellSize = clusterRadius;
    const grid = new Map<string, { pins: typeof pins; center: { lat: number; lng: number }; count: number }>();

    // Bucket pins into grid cells
    for (const pin of pins) {
      const cellX = Math.floor(pin.lat * 1000000 / cellSize);
      const cellY = Math.floor(pin.lng * 1000000 / cellSize);
      const key = cellX + ',' + cellY;
      if (!grid.has(key)) {
        grid.set(key, { pins: [], center: { lat: pin.lat, lng: pin.lng }, count: 0 });
      }
      const cell = grid.get(key)!;
      cell.pins.push(pin);
      cell.count++;
    }

    // Cluster cells that are within clusterRadius * 2 (approximate meters)
    const merged = [];
    const visited = new Set<string>();

    for (const [key, cell] of grid) {
      if (visited.has(key)) continue;
      const group = [cell];
      visited.add(key);

      for (const [otherKey, otherCell] of grid) {
        if (visited.has(otherKey)) continue;
        const dLat = cell.center.lat - otherCell.center.lat;
        const dLng = cell.center.lng - otherCell.center.lng;
        const distMeters = Math.sqrt(dLat * dLat + dLng * dLng) * 111000; // approx meters
        if (distMeters < clusterRadius * 2) {
          group.push(otherCell);
          visited.add(otherKey);
        }
      }

      const valid = group.filter(g => g.count > 0);
      if (valid.length > 0) {
        const largest = valid.reduce((a, b) => a.count > b.count ? a : b);
        // Determine kind from pins in cluster
        const kind = largest.pins[0]?.kind ?? 'service';
        merged.push({
          id: 'cluster-' + key,
          isCluster: true,
          count: largest.count,
          pins: largest.pins,
          lat: largest.center.lat,
          lng: largest.center.lng,
          emoji: '&#128681;',
          kind,
        });
      }
    }

    return merged;
  }
</script>

<div class="relative w-full h-full min-h-[340px] bg-slate-900 overflow-hidden rounded-3xl select-none" role="region" aria-label="Mapa geográfico OpenStreetMap">
  <div bind:this={mapContainer} class="w-full h-full z-0"></div>

  <!-- Controls: top-right -->
  <div class="absolute top-4 right-4 z-[400] flex flex-col gap-2">
    {#if userLocation}
      <button
        onclick={handleCenterUser}
        title="Centrar en mi ubicación"
        class="p-2.5 rounded-xl bg-white/90 hover:bg-white text-petroleo border border-linea/60 shadow-lg backdrop-blur-md transition-all active:scale-95 flex items-center justify-center"
      >
        <LocateFixed class="w-5 h-5 text-petroleo" />
      </button>
    {/if}

    <button
      onclick={handleFitAll}
      title="Ver todos los puntos"
      class="p-2.5 rounded-xl bg-white/90 hover:bg-white text-slate-600 border border-linea/60 shadow-lg backdrop-blur-md transition-all active:scale-95 flex items-center justify-center"
    >
      <Eye class="w-5 h-5 text-slate-600" />
    </button>

    {#if enableTracking}
      <button
        onclick={toggleTracking}
        title={isTracking ? "Detener seguimiento GPS" : "Iniciar seguimiento GPS"}
        class="p-2.5 rounded-xl bg-white/90 hover:bg-white border border-linea/60 shadow-lg backdrop-blur-md transition-all active:scale-95 flex items-center justify-center {isTracking ? 'bg-red-50 text-red-600' : 'text-slate-600'}"
      >
        {#if isTracking}
          <svg class="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12"/></svg>
        {:else}
          <svg class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        {/if}
      </button>
    {/if}

    <div class="relative">
      <button
        onclick={() => (showTileMenu = !showTileMenu)}
        title="Estilo de mapa"
        class="p-2.5 rounded-xl bg-white/90 hover:bg-white text-slate-600 border border-linea/60 shadow-lg backdrop-blur-md transition-all active:scale-95 flex items-center justify-center"
      >
        <Layers class="w-5 h-5 text-slate-600" />
      </button>

      {#if showTileMenu}
        <div class="absolute right-0 top-12 w-44 rounded-xl bg-white/95 border border-linea/60 shadow-2xl p-2 z-50 backdrop-blur-lg flex flex-col gap-1">
          <span class="text-[11px] font-semibold text-gris px-2 py-1">Estilo:</span>
          <button
            onclick={() => changeTile('voyager')}
            class="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between {activeTile === 'voyager' ? 'bg-petroleo/10 text-petroleo' : 'text-gris hover:bg-slate-100'}"
          >
            <span>Carto Voyager</span>
            {#if activeTile === 'voyager'}<span class="text-[10px]">✓</span>{/if}
          </button>
          <button
            onclick={() => changeTile('osm')}
            class="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between {activeTile === 'osm' ? 'bg-petroleo/10 text-petroleo' : 'text-gris hover:bg-slate-100'}"
          >
            <span>OSM Estándar</span>
            {#if activeTile === 'osm'}<span class="text-[10px]">✓</span>{/if}
          </button>
          <button
            onclick={() => changeTile('dark')}
            class="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between {activeTile === 'dark' ? 'bg-petroleo/10 text-petroleo' : 'text-gris hover:bg-slate-100'}"
          >
            <span>Oscuro</span>
            {#if activeTile === 'dark'}<span class="text-[10px]">✓</span>{/if}
          </button>
        </div>
      {/if}
    </div>
  </div>

  <!-- Empty state hint -->
  <div class="absolute top-4 left-4 z-[400] pointer-events-none">
    <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-linea/60 text-xs text-slate-600 shadow-lg">
      <MapPin class="w-3.5 h-3.5 text-petroleo shrink-0" />
      <span>Mapa geográfico · OSM</span>
    </div>
  </div>

  <!-- Geocoding search -->
  <div class="absolute top-20 left-4 right-4 z-[400] pointer-events-auto">
    <div class="relative w-full max-w-sm">
      <input
        bind:value={searchQuery}
        onkeydown={(e) => { if (e.key === 'Enter' && searchQuery.trim()) { onGeocodeSearch(searchQuery.trim()); } }}
        placeholder="🔍 Buscar ciudad / sector (ej: Lima, Arequipa, Cusco…)"
        class="w-full pl-9 pr-3 py-2 rounded-xl border border-linea/60 bg-white/90 backdrop-blur-md text-sm placeholder-gris focus:outline-none focus:border-petroleo/50"
      />
      <div class="absolute left-3 top-1/2 -translate-y-1/2 text-gris">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
      </div>
    </div>
  </div>

  <!-- Geocoding results dropdown -->
  {#if geocodeResults.length > 0}
    <div class="absolute top-28 left-4 right-4 z-[401] max-h-60 overflow-auto rounded-2xl bg-white/95 backdrop-blur-md border border-linea/60 shadow-xl">
      <div class="p-2 font-semibold text-xs text-gris">Resultados para "<strong>{searchQuery}</strong>":</div>
      {#each geocodeResults as r (r.name)}
        <button
          type="button"
          onclick={() => selectGeocodeResult(r)}
          class="w-full text-left px-3 py-2 rounded-xl hover:bg-petroleo/10 hover:text-petroleo flex items-center gap-2"
        >
          <span class="flex-1 text-sm font-bold text-negro">{r.name}</span>
          <span class="text-xs text-gris font-mono">{r.city || ''}</span>
        </button>
      {/each}
    </div>
  {/if}

  <!-- Tracking error -->
  {#if trackingError}
    <div class="absolute top-4 left-1/2 -translate-x-1/2 z-[400] px-3 py-2 rounded-full bg-red-50 border border-red-200 shadow-lg">
      <span class="text-xs font-bold text-red-800">{trackingError}</span>
    </div>
  {/if}

  <!-- No location warning -->
  {#if !userLocation && pins.length > 0}
    <div class="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400] flex items-center gap-2 px-3 py-2 rounded-full bg-amber-50 border border-amber-200 shadow-lg">
      <AlertTriangle class="w-4 h-4 text-amber-600" />
      <span class="text-xs font-bold text-amber-800">Sin ubicación activa — los puntos se muestran desde tu sector guardado</span>
    </div>
  {/if}
</div>