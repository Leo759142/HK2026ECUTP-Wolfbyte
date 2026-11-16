const fs = require('fs');

const path = 'e:\\Proyecto XYZ\\CuasiFinalPOD\\HK2026ECUTP-Wolfbyte 800\\frontend\\src\\lib\\ui\\MapaOSM.svelte';
let content = fs.readFileSync(path, 'utf8');

// 6. Remove the reactive $: if (mapInstance) { renderUser(); renderMarkers(); }
const oldReactive = `  $: if (mapInstance) {
    renderUser();
    renderMarkers();
  }`;

const newManual = `  function updateMarkers() {
    if (mapInstance) {
      renderUser();
      renderMarkers();
    }
  }`;

if (content.includes('if (mapInstance) { renderUser(); renderMarkers(); }')) {
  content = content.replace(oldReactive, newManual);
  console.log('Part 4: Removed reactive $: block');
}

// 7. Add manual update calls in watchPosition callback
const watchCallbackOld = `          (loc) => {
            userLocation = loc;
            if (userMarker && mapInstance) {
              if (mapInstance.getZoom && mapInstance.getZoom() < 15) {
                mapInstance.setView([loc.coords.lat, loc.coords.lng], 16);
              }
            }
            renderUser();
          },`;
const watchCallbackNew = `          (loc) => {
            userLocation = loc;
            if (userMarker && mapInstance) {
              if (mapInstance.getZoom && mapInstance.getZoom() < 15) {
                mapInstance.setView([loc.coords.lat, loc.coords.lng], 16);
              }
            }
            renderUser();
            updateMarkers();
          },`;
if (content.includes('function (loc) => {')) {
  content = content.replace(watchCallbackOld, watchCallbackNew);
  console.log('Part 4: Added manual updateMarkers call');
}

// 8. Fix cluster icon template (use template string)
const oldClusterIcon = `<div style="font-size:22px;">' + 'pin.count' + '</div>`;
const newClusterIcon = '<div style="font-size:22px;">' + '${pin.count}' + '</div>';

if (content.includes('<div style="font-size:22px;">' + 'pin.count' + '</div>')) {
  content = content.replace(oldClusterIcon, newClusterIcon);
  console.log('Part 4: Fixed cluster icon template');
}

fs.writeFileSync(path, content);
