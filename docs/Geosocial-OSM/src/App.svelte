<script lang="ts">
  import { onMount } from 'svelte';
  import confetti from 'canvas-confetti';
  import { 
    Download, 
    FlaskConical, 
    Globe, 
    ListFilter, 
    LocateFixed, 
    MapPin, 
    Plus, 
    RotateCcw, 
    ShieldCheck, 
    Sparkles, 
    Upload 
  } from 'lucide-svelte';

  import type { Category, Coordinates, POI, Review, SortOption, UserLocation } from './types/poi';
  import { calculateDistance } from './utils/distance';
  import { GeoLocationService } from './services/geoService';
  import { PoiStorageService } from './services/poiService';

  import Map from './components/Map.svelte';
  import PoiList from './components/PoiList.svelte';
  import PoiModal from './components/PoiModal.svelte';
  import PoiDetailPopup from './components/PoiDetailPopup.svelte';
  import SystemAuditModal from './components/SystemAuditModal.svelte';
  import GeoConsentModal from './components/GeoConsentModal.svelte';
  import IsoDocumentationModal from './components/IsoDocumentationModal.svelte';
  import PWAInstallButton from './components/PWAInstallButton.svelte';
  import OfflineIndicator from './components/OfflineIndicator.svelte';

  let pois: POI[] = PoiStorageService.getAll();
  let userLocation: UserLocation | null = GeoLocationService.getCachedLocation();

  let isGeoModalOpen = false;
  let isIsoModalOpen = false;
  let isAuditModalOpen = false;
  let isPoiModalOpen = false;
  let isDetailPopupOpen = false;
  let poiModalMode: 'create' | 'edit' = 'create';
  let editingPoi: POI | null = null;

  let tempCoords: Coordinates | null = null;
  let selectedPoi: POI | null = null;

  let selectedCategory: Category | 'all' = 'all';
  let searchQuery = '';
  let sortBy: SortOption = 'distance';
  let onlyFavorites = false;

  let mobileTab: 'map' | 'list' = 'map';
  let toastMessage: string | null = null;

  function showToast(msg: string) {
    toastMessage = msg;
    setTimeout(() => {
      toastMessage = null;
    }, 3000);
  }

  onMount(() => {
    if (!GeoLocationService.getCachedLocation()) {
      isGeoModalOpen = true;
    }
  });

  // Cálculo reactivo de distancias Haversine y filtros
  $: enrichedPois = pois
    .map((poi) => {
      const distance = userLocation
        ? calculateDistance(userLocation.coords, poi.coords)
        : undefined;
      return { ...poi, distance };
    })
    .filter((poi) => {
      if (selectedCategory !== 'all' && poi.category !== selectedCategory) {
        return false;
      }
      if (onlyFavorites && !poi.isFavorite) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = poi.name.toLowerCase().includes(q);
        const matchDesc = poi.description?.toLowerCase().includes(q);
        const matchAddr = poi.address?.toLowerCase().includes(q);
        const matchTags = poi.tags?.some((t) => t.toLowerCase().includes(q));
        return matchName || matchDesc || matchAddr || matchTags;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'distance') {
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      }
      if (sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortBy === 'newest') {
        return (b.createdAt || 0) - (a.createdAt || 0);
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

  $: closestPoi = (() => {
    if (!userLocation || enrichedPois.length === 0) return null;
    const sorted = [...enrichedPois].filter((p) => p.distance !== undefined && p.distance <= 0.6);
    return sorted.length > 0 ? sorted[0] : null;
  })();

  function handleSelectPoi(poi: POI | null) {
    selectedPoi = poi;
    if (poi) {
      isDetailPopupOpen = true;
    }
  }

  function handleMapClick(coords: Coordinates) {
    tempCoords = coords;
    editingPoi = null;
    poiModalMode = 'create';
    isPoiModalOpen = true;
  }

  function handleSavePoi(poiData: Omit<POI, 'id' | 'createdAt'>) {
    if (poiModalMode === 'create') {
      const created = PoiStorageService.create(poiData);
      pois = PoiStorageService.getAll();
      handleSelectPoi(created);
      showToast(`«${created.name}» guardado con éxito.`);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    } else if (poiModalMode === 'edit' && editingPoi) {
      PoiStorageService.update(editingPoi.id, poiData);
      pois = PoiStorageService.getAll();
      showToast(`«${poiData.name}» actualizado.`);
    }
    tempCoords = null;
  }

  function handleDeletePoi(id: string) {
    const poiToDelete = pois.find((p) => p.id === id);
    if (!poiToDelete) return;
    if (confirm(`¿Deseas eliminar «${poiToDelete.name}» de tu lista de POIs?`)) {
      PoiStorageService.delete(id);
      pois = PoiStorageService.getAll();
      if (selectedPoi?.id === id) {
        selectedPoi = null;
        isDetailPopupOpen = false;
      }
      showToast('Punto eliminado.');
    }
  }

  function handleToggleFavorite(id: string) {
    const isFav = PoiStorageService.toggleFavorite(id);
    pois = PoiStorageService.getAll();
    if (selectedPoi?.id === id) {
      selectedPoi = pois.find((p) => p.id === id) || null;
    }
    showToast(isFav ? 'Añadido a tus favoritos ❤️' : 'Removido de favoritos');
  }

  function handleReviewPoi(poiId: string, reviewData: Omit<Review, 'id' | 'date'>) {
    const updated = PoiStorageService.addReview(poiId, reviewData);
    if (updated) {
      pois = PoiStorageService.getAll();
      selectedPoi = updated;
      showToast('¡Reseña publicada y calificación recalculada!');
      confetti({ particleCount: 30, spread: 50 });
    }
  }

  async function handleSharePoi(poi: POI) {
    const shareUrl = `https://www.openstreetmap.org/?mlat=${poi.coords.lat}&mlon=${poi.coords.lng}#map=16/${poi.coords.lat}/${poi.coords.lng}`;
    const text = `¡Te comparto este lugar en GeoSocial! ${poi.name} (${poi.category.toUpperCase()}) - ${poi.address || 'Ver en mapa'}: ${shareUrl}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: poi.name,
          text: poi.description || text,
          url: shareUrl,
        });
        showToast('Compartido exitosamente');
        return;
      } catch {
        // Fallback al portapapeles
      }
    }

    try {
      await navigator.clipboard.writeText(`${poi.name}: ${shareUrl}`);
      showToast('¡Enlace de OpenStreetMap copiado al portapapeles! 📋');
      confetti({ particleCount: 25, spread: 45, origin: { y: 0.8 } });
    } catch {
      showToast('Error al copiar enlace.');
    }
  }

  function handleSeedCurrentArea() {
    if (!userLocation) {
      isGeoModalOpen = true;
      return;
    }
    const label = userLocation.city || 'Mi Zona';
    pois = PoiStorageService.seedAroundCoordinates(userLocation.coords, label);
    showToast(`Se añadieron 5 lugares de muestra en ${label}`);
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
  }

  function handleExportJson() {
    const jsonStr = PoiStorageService.exportJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `geosocial-pois-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Archivo JSON exportado.');
  }

  function handleImportJson(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = PoiStorageService.importJson(content);
        if (result.success) {
          pois = PoiStorageService.getAll();
          showToast(`¡Se importaron ${result.count} POIs con éxito!`);
          confetti({ particleCount: 40, spread: 60 });
        } else {
          alert(result.error || 'Archivo inválido');
        }
      }
    };
    reader.readAsText(file);
    target.value = '';
  }

  function handleResetDefaults() {
    if (confirm('¿Restablecer los lugares a la lista predeterminada?')) {
      pois = PoiStorageService.resetToDefaults();
      showToast('Datos restablecidos a los de fábrica.');
    }
  }
</script>

<div class="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
  {#if toastMessage}
    <div class="fixed top-16 left-1/2 -translate-x-1/2 z-[2000] px-4 py-2 rounded-xl bg-blue-600/95 text-white font-medium text-xs shadow-2xl backdrop-blur-md border border-blue-400/40 animate-in fade-in slide-in-from-top-3 flex items-center gap-2">
      <span>{toastMessage}</span>
    </div>
  {/if}

  {#if closestPoi}
    <div class="bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-1.5 text-xs font-semibold text-white flex items-center justify-between shrink-0 shadow-sm z-30">
      <div class="flex items-center gap-2 truncate">
        <span class="w-2 h-2 rounded-full bg-white animate-ping"></span>
        <span class="truncate">
          🎯 ¡Estás muy cerca de <strong>{closestPoi.name}</strong> ({closestPoi.distance ? `${Math.round(closestPoi.distance * 1000)} m` : ''})!
        </span>
      </div>
      <button
        on:click={() => {
          handleSelectPoi(closestPoi);
          mobileTab = 'map';
        }}
        class="text-[11px] underline font-bold px-2 py-0.5 rounded bg-black/20 hover:bg-black/30 shrink-0 ml-2"
      >
        Ver en mapa & popup
      </button>
    </div>
  {/if}

  <!-- Cabecera Principal -->
  <header class="px-3 sm:px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0 z-20">
    <div class="flex items-center gap-2.5">
      <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
        <MapPin class="w-5 h-5" />
      </div>
      <div>
        <div class="flex items-center gap-2">
          <h1 class="font-extrabold text-sm sm:text-base text-white tracking-tight">
            GeoSocial <span class="text-blue-400">OSM</span>
          </h1>
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/40 text-blue-300 font-mono font-bold">
            Svelte 5 PWA
          </span>
        </div>
        <p class="text-[10px] sm:text-xs text-slate-400 truncate max-w-[200px] sm:max-w-md">
          Svelte &bull; OpenStreetMap &bull; LocalStorage CRUD &bull; ISO 25010
        </p>
      </div>
    </div>

    <!-- Acciones de Cabecera -->
    <div class="flex items-center gap-1.5 sm:gap-2">
      <button
        on:click={() => (isGeoModalOpen = true)}
        class="px-2.5 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition active:scale-95 {userLocation ? 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30 animate-pulse'}"
        title="Ajustar permisos o proveedor de ubicación"
      >
        {#if userLocation?.provider === 'gps'}
          <LocateFixed class="w-3.5 h-3.5 text-blue-400 shrink-0" />
        {:else if userLocation?.provider === 'ip'}
          <Globe class="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        {:else}
          <MapPin class="w-3.5 h-3.5 text-amber-400 shrink-0" />
        {/if}
        <span class="hidden sm:inline">
          {#if userLocation}
            {userLocation.city ? `${userLocation.city} (${userLocation.provider.toUpperCase()})` : userLocation.provider.toUpperCase()}
          {:else}
            Activar Ubicación
          {/if}
        </span>
      </button>

      <button
        on:click={() => (isIsoModalOpen = true)}
        class="px-2.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
        title="Ver Especificación Formal y Matriz ISO/IEC 25010"
      >
        <ShieldCheck class="w-3.5 h-3.5 text-indigo-400" />
        <span class="hidden md:inline">ISO 25010</span>
      </button>

      <button
        on:click={() => (isAuditModalOpen = true)}
        class="px-2.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
        title="Ejecutar Suite de Pruebas en Vivo y Monitoreo de Procesos Críticos"
      >
        <FlaskConical class="w-3.5 h-3.5 text-emerald-400" />
        <span class="hidden lg:inline">Suite Pruebas</span>
      </button>

      <PWAInstallButton />

      <!-- Herramientas adicionales -->
      <div class="flex items-center gap-1">
        <button
          on:click={handleSeedCurrentArea}
          class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 text-xs transition"
          title="Sembrar lugares de muestra en mi zona actual"
        >
          <Sparkles class="w-4 h-4 text-amber-400" />
        </button>
        <button
          on:click={handleExportJson}
          class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 text-xs transition hidden sm:flex"
          title="Exportar respaldo JSON de lugares"
        >
          <Download class="w-4 h-4" />
        </button>
        <label
          class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 text-xs transition cursor-pointer hidden sm:flex"
          title="Importar lugares desde JSON"
        >
          <Upload class="w-4 h-4" />
          <input type="file" accept=".json" on:change={handleImportJson} class="hidden" />
        </label>
        <button
          on:click={handleResetDefaults}
          class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/80 text-xs transition hidden lg:flex"
          title="Restablecer datos de fábrica"
        >
          <RotateCcw class="w-4 h-4" />
        </button>
      </div>
    </div>
  </header>

  <!-- Contenedor Principal: Split View en Pantallas Grandes, Tabs en Móvil -->
  <main class="flex-1 flex flex-col md:flex-row overflow-hidden relative">
    <div class="flex-1 h-full relative {mobileTab === 'map' ? 'block' : 'hidden md:block'}">
      <Map
        userLocation={userLocation}
        pois={enrichedPois}
        selectedPoi={selectedPoi}
        tempCoords={tempCoords}
        onMapClick={handleMapClick}
        onSelectPoi={handleSelectPoi}
        onEditPoi={(poi) => {
          editingPoi = poi;
          poiModalMode = 'edit';
          isPoiModalOpen = true;
        }}
        onDeletePoi={handleDeletePoi}
        onSharePoi={handleSharePoi}
      />
    </div>

    <div class="w-full md:w-96 lg:w-[440px] h-full shrink-0 {mobileTab === 'list' ? 'block' : 'hidden md:block'}">
      <PoiList
        pois={enrichedPois}
        selectedPoi={selectedPoi}
        selectedCategory={selectedCategory}
        searchQuery={searchQuery}
        sortBy={sortBy}
        onlyFavorites={onlyFavorites}
        userLocation={userLocation}
        onSelectPoi={(poi) => {
          handleSelectPoi(poi);
          mobileTab = 'map';
        }}
        onSelectCategory={(cat) => (selectedCategory = cat)}
        onSearchChange={(q) => (searchQuery = q)}
        onSortChange={(s) => (sortBy = s)}
        onToggleFavoritesOnly={() => (onlyFavorites = !onlyFavorites)}
        onToggleFavorite={handleToggleFavorite}
        onEditPoi={(poi) => {
          editingPoi = poi;
          poiModalMode = 'edit';
          isPoiModalOpen = true;
        }}
        onDeletePoi={handleDeletePoi}
        onSharePoi={handleSharePoi}
        onOpenCreate={() => {
          editingPoi = null;
          poiModalMode = 'create';
          tempCoords = null;
          isPoiModalOpen = true;
        }}
      />
    </div>
  </main>

  <!-- Barra de navegación inferior móvil -->
  <nav class="md:hidden flex items-center justify-around bg-slate-900 border-t border-slate-800 p-2 shrink-0 z-30">
    <button
      on:click={() => (mobileTab = 'map')}
      class="flex flex-col items-center gap-0.5 py-1 px-4 rounded-xl transition {mobileTab === 'map' ? 'text-blue-400 font-bold' : 'text-slate-400'}"
    >
      <MapPin class="w-5 h-5" />
      <span class="text-[10px]">Mapa</span>
    </button>

    <button
      on:click={() => {
        editingPoi = null;
        poiModalMode = 'create';
        tempCoords = null;
        isPoiModalOpen = true;
      }}
      class="w-11 h-11 -mt-4 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/40 border-2 border-slate-900"
      title="Nuevo Lugar"
    >
      <Plus class="w-6 h-6" />
    </button>

    <button
      on:click={() => (mobileTab = 'list')}
      class="flex flex-col items-center gap-0.5 py-1 px-4 rounded-xl transition relative {mobileTab === 'list' ? 'text-blue-400 font-bold' : 'text-slate-400'}"
    >
      <ListFilter class="w-5 h-5" />
      <span class="text-[10px]">Lista ({enrichedPois.length})</span>
    </button>
  </nav>

  <OfflineIndicator />

  <GeoConsentModal
    isOpen={isGeoModalOpen}
    onClose={() => (isGeoModalOpen = false)}
    onLocationResolved={(loc) => {
      userLocation = loc;
      showToast(`Ubicación establecida por ${loc.provider.toUpperCase()}${loc.city ? ` (${loc.city})` : ''}`);
    }}
  />

  <IsoDocumentationModal
    isOpen={isIsoModalOpen}
    onClose={() => (isIsoModalOpen = false)}
  />

  <PoiModal
    isOpen={isPoiModalOpen}
    mode={poiModalMode}
    initialPoi={editingPoi}
    initialCoords={tempCoords}
    userLocation={userLocation}
    onClose={() => {
      isPoiModalOpen = false;
      tempCoords = null;
    }}
    onSave={handleSavePoi}
  />

  <PoiDetailPopup
    poi={isDetailPopupOpen ? selectedPoi : null}
    userLocation={userLocation}
    onClose={() => {
      isDetailPopupOpen = false;
      selectedPoi = null;
    }}
    onEdit={(poi) => {
      isDetailPopupOpen = false;
      editingPoi = poi;
      poiModalMode = 'edit';
      isPoiModalOpen = true;
    }}
    onDelete={handleDeletePoi}
    onShare={handleSharePoi}
    onToggleFavorite={handleToggleFavorite}
    onAddReview={handleReviewPoi}
  />

  <SystemAuditModal
    isOpen={isAuditModalOpen}
    userLocation={userLocation}
    pois={enrichedPois}
    onClose={() => (isAuditModalOpen = false)}
  />
</div>
