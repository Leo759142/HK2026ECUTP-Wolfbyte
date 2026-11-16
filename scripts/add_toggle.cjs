const fs = require('fs');
const path = 'e:\\Proyecto XYZ\\CuasiFinalPOD\\HK2026ECUTP-Wolfbyte 800\\frontend\\src\\lib\\ui\\MapaOSM.svelte';
let content = fs.readFileSync(path, 'utf8');

// Find end of handleFitAll function
const handleFitAllIdx = content.indexOf('function handleFitAll');
const fitBoundsIdx = content.indexOf('fitBounds', handleFitAllIdx);
const fnEnd = content.indexOf('}', fitBoundsIdx);

const toggleTrackingFn = `
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
  }
`;

content = content.slice(0, fnEnd + 1) + toggleTrackingFn + content.slice(fnEnd + 1);
fs.writeFileSync(path, content);
console.log('Added toggleTracking function');
console.log('Has toggleTracking:', content.includes('toggleTracking'));
console.log('Has watchPosition call:', content.includes('GeoLocationService.watchPosition'));
