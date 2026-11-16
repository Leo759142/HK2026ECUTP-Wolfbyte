const fs = require('fs');

const path = 'e:\\Proyecto XYZ\\CuasiFinalPOD\\HK2026ECUTP-Wolfbyte 800\\frontend\\src\\lib\\ui\\MapaOSM.svelte';
let content = fs.readFileSync(path, 'utf8');

// 7. Replace toggleTracking function (fix nesting issue)
const oldToggle = `  function toggleTracking() {
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
            if (userMarker) {
              mapInstance?.setView([loc.coords.lat, loc.coords.lng], 16);
            }
            renderUser();
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
  }`;

const newToggle = `  function toggleTracking() {
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
  }`;

if (content.includes('function toggleTracking()')) {
  content = content.replace(oldToggle, newToggle);
  console.log('Part 3: Fixed toggleTracking');
}

// 8. Replace onGeocodeSearch and selectGeocodeResult (outside toggleTracking)
const oldGeocodeFunctions = `  async function onGeocodeSearch(query) {
    if (!query) return;
    try {
      const results = await GeoLocationService.geocode(query);
      geocodeResults = results;
    } catch {
      geocodeResults = [];
    }
  }

  function selectGeocodeResult(r) {
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
  }`;

const newGeocodeFunctions = `  async function onGeocodeSearch(query) {
    if (!query) return;
    try {
      const results = await GeoLocationService.geocode(query);
      geocodeResults = results;
    } catch {
      geocodeResults = [];
    }
  }

  function selectGeocodeResult(r) {
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
  }`;

if (content.includes('async function onGeocodeSearch(query) {')) {
  // Check if these functions were incorrectly nested inside toggleTracking
  // If they appear before the toggleTracking function, they're already fixed
  const toggleStart = content.indexOf('function toggleTracking()');
  const geocodeStart = content.indexOf('async function onGeocodeSearch');
  if (geocodeStart > toggleStart) {
    // They are nested - extract them by finding the toggle tracking function end and replacing the whole thing
    const toggleEnd = content.indexOf('}', toggleStart);
    const newToggleOnly = `  function toggleTracking() {
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
  }`;
    content = content.slice(0, toggleStart) + newToggleOnly + content.slice(toggleEnd + 1);
    console.log('Part 3: Fixed toggleTracking nesting');
  } else {
    // Already outside - just verify
    console.log('Part 3: geocode functions already outside toggleTracking');
  }
}

fs.writeFileSync(path, content);
