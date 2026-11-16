const fs = require('fs');
const path = 'e:\\Proyecto XYZ\\CuasiFinalPOD\\HK2026ECUTP-Wolfbyte 800\\frontend\\src\\lib\\ui\\MapaOSM.svelte';
let content = fs.readFileSync(path, 'utf8');

// Check cluster icon
const iconPos = content.indexOf('pin.count</div>');
console.log('1. Cluster icon pos:', iconPos);
if (iconPos !== -1) {
  console.log('1a. Context:', JSON.stringify(content.slice(iconPos - 20, iconPos + 20)));
  console.log('1b. Has template:', content.includes('${pin.count}'));
}

// Check onGeocodeSearch vs toggleTracking
const geocodePos = content.indexOf('async function onGeocodeSearch');
const togglePos = content.indexOf('function toggleTracking');
console.log('2. geocodePos:', geocodePos, 'togglePos:', togglePos);
console.log('3. onGeocodeSearch inside toggleTracking:', geocodePos > togglePos && geocodePos !== -1);

// Check updateMarkers call
const callIdx = content.indexOf('updateMarkers()');
console.log('4. updateMarkers() at:', callIdx);
if (callIdx !== -1) {
  console.log('4a. Context:', JSON.stringify(content.slice(callIdx - 50, callIdx + 50)));
}
