const fs = require('fs');

const path = 'e:\\Proyecto XYZ\\CuasiFinalPOD\\HK2026ECUTP-Wolfbyte 800\\frontend\\src\\lib\\ui\\MapaOSM.svelte';
let content = fs.readFileSync(path, 'utf8');

// 3. Fix geocode function - add TTL check
const oldGeocodeCacheRead = `    const cacheKey = 'geocode:' + query.toLowerCase().trim();
    try {
      const cached = localStorage.getItem('ayni_geocode_cache');
      const all = cached ? (JSON.parse(cached) as Record<string, any[]>) : {};
      if (all[cacheKey]) return all[cacheKey];
    } catch { /* ignore */ }`;

const newGeocodeCacheRead = `    const cacheKey = 'geocode:' + query.toLowerCase().trim();
    try {
      const cached = localStorage.getItem('ayni_geocode_cache');
      const all = cached ? (JSON.parse(cached) as Record<string, any[]>) : {};
      const entry = all[cacheKey];
      if (entry) {
        if (Date.now() - entry.ts > 24 * 60 * 60 * 1000) {
          delete all[cacheKey];
          localStorage.setItem('ayni_geocode_cache', JSON.stringify(all));
        } else {
          return entry.results;
        }
      }
    } catch { /* ignore */ }`;

if (content.includes('const cacheKey = \'geocode:\'')) {
  content = content.replace(oldGeocodeCacheRead, newGeocodeCacheRead);
  console.log('Part 2: Fixed geocode cache TTL');
}

// 4. Fix address fallback in geocode
const oldAddress = `address: item.address?.road || item.address?.pedestrian || '',`;
const newAddress = `address: item.address?.road || item.address?.pedestrian || item.address?.suburb || item.address?.neighbourhood || '',`;

if (content.includes('item.address?.road')) {
  content = content.replace(oldAddress, newAddress);
  console.log('Part 2: Fixed address fallback');
}

// 5. Fix accuracy circle (raise cap from 500 to 2000)
content = content.replace('radius: Math.min(acc, 500)', 'radius: Math.min(acc, 2000)');
console.log('Part 2: Fixed accuracy circle cap');

// 6. Fix watchPosition zoom - only center if zoom < 15
content = content.replace(
  'mapInstance?.setView([loc.coords.lat, loc.coords.lng], 16)',
  'if (!mapInstance.getZoom || mapInstance.getZoom() < 15) mapInstance.setView([loc.coords.lat, loc.coords.lng], 16);'
);
console.log('Part 2: Fixed watchPosition zoom');

fs.writeFileSync(path, content);
