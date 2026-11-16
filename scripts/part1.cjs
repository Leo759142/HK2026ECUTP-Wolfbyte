const fs = require('fs');

const path = 'e:\\Proyecto XYZ\\CuasiFinalPOD\\HK2026ECUTP-Wolfbyte 800\\frontend\\src\\lib\\ui\\MapaOSM.svelte';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix geocodeResults from $derived to $state
content = content.replace(
  'let geocodeResults = $derived([]);',
  'let geocodeResults = $state([]);'
);

// 2. Fix clusterPins - iterate grid.values() and use meters
const oldCluster = `  // Clustering: group pins that are close together
  function getClusterOptions() {
    if (pins.length < 8) return { enabled: false, clusterRadius: 40, clusterMinSize: 2 };
    return { enabled: true, clusterRadius: 50, clusterMinSize: 2 };
  }

  function clusterPins() {
    const { enabled, clusterRadius, clusterMinSize } = getClusterOptions();
    if (!enabled || pins.length < 8) return pins;

    const clusters = [];
    const cellSize = clusterRadius;
    const grid = new Map();

    for (const pin of pins) {
      const cellX = Math.floor(pin.lat * 1000000 / cellSize);
      const cellY = Math.floor(pin.lng * 1000000 / cellSize);
      const key = cellX + ',' + cellY;
      if (!grid.has(key)) {
        grid.set(key, { pins: [], center: { lat: pin.lat, lng: pin.lng }, count: 0 });
      }
      const cell = grid.get(key);
      cell.pins.push(pin);
      cell.count++;
    }

    // Group cells that are within clusterRadius * 2
    const merged = [];
    const visited = new Set();
    for (let i = 0; i < clusters.length; i++) {
      if (visited.has(i)) continue;
      const c = clusters[i];
      const group = [c];
      visited.add(i);
      for (let j = i + 1; j < clusters.length; j++) {
        if (visited.has(j)) continue;
        const cj = clusters[j];
        const dist = Math.sqrt((c.center.lat - cj.center.lat) ** 2 + (c.center.lng - cj.center.lng) ** 2);
        if (dist < clusterRadius * 2) {
          group.push(cj);
          visited.add(j);
        }
      }
      const valid = group.filter(g => g.count > 0);
      if (valid.length > 0) {
        const largest = valid.reduce((a, b) => a.count > b.count ? a : b);
        merged.push({
          id: 'cluster-' + i,
          isCluster: true,
          count: largest.count,
          pins: largest.pins,
          lat: largest.center.lat,
          lng: largest.center.lng,
          emoji: '&#128681;',
        });
      }
    }

    return merged;
  }`;

const newCluster = `  // Clustering: group pins that are close together (distance in approximate meters)
  function getClusterOptions() {
    if (pins.length < 8) return { enabled: false, clusterRadius: 40, clusterMinSize: 2 };
    return { enabled: true, clusterRadius: 50, clusterMinSize: 2 };
  }

  function clusterPins() {
    const { enabled, clusterRadius, clusterMinSize } = getClusterOptions();
    if (!enabled || pins.length < 8) return pins;

    const cellSize = clusterRadius;
    const grid = new Map();

    // Bucket pins into grid cells
    for (const pin of pins) {
      const cellX = Math.floor(pin.lat * 1000000 / cellSize);
      const cellY = Math.floor(pin.lng * 1000000 / cellSize);
      const key = cellX + ',' + cellY;
      if (!grid.has(key)) {
        grid.set(key, { pins: [], center: { lat: pin.lat, lng: pin.lng }, count: 0 });
      }
      const cell = grid.get(key);
      cell.pins.push(pin);
      cell.count++;
    }

    // Cluster cells that are within clusterRadius * 2 (approximate meters)
    const merged = [];
    const visited = new Set();
    for (const [key, cell] of grid) {
      if (visited.has(key)) continue;
      const group = [cell];
      visited.add(key);
      for (const [otherKey, otherCell] of grid) {
        if (visited.has(otherKey)) continue;
        const dx = cell.center.lat - otherCell.center.lat;
        const dy = cell.center.lng - otherCell.center.lng;
        const distMeters = Math.sqrt(dx * dx + dy * dy) * 111000; // approx meters
        if (distMeters < clusterRadius * 2) {
          group.push(otherCell);
          visited.add(otherKey);
        }
      }
      const valid = group.filter(g => g.count > 0);
      if (valid.length > 0) {
        const largest = valid.reduce((a, b) => a.count > b.count ? a : b);
        merged.push({
          id: 'cluster-' + key,
          isCluster: true,
          count: largest.count,
          pins: largest.pins,
          lat: largest.center.lat,
          lng: largest.center.lng,
          emoji: '&#128681;', // 🔁
        });
      }
    }

    return merged;
  }`;

if (content.includes('// Clustering: group pins that are close together')) {
  content = content.replace(oldCluster, newCluster);
  console.log('Part 1: Fixed clusterPins');
} else {
  console.log('Part 1: clusterPins not found for replacement');
}

fs.writeFileSync(path, content);
