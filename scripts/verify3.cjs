const fs = require('fs');
const path = 'e:\\Proyecto XYZ\\CuasiFinalPOD\\HK2026ECUTP-Wolfbyte 800\\frontend\\src\\lib\\ui\\MapaOSM.svelte';
let content = fs.readFileSync(path, 'utf8');

// Check template literal
const templatePos = content.indexOf('${pin.count}');
console.log('1. Template literal pos:', templatePos);
if (templatePos !== -1) {
  console.log('1a. Context:', JSON.stringify(content.slice(templatePos - 30, templatePos + 30)));
}

// Check onGeocodeSearch vs toggleTracking
const geocodePos = content.indexOf('async function onGeocodeSearch');
const togglePos = content.indexOf('function toggleTracking');
console.log('2. geocodePos:', geocodePos, 'togglePos:', togglePos);
const insideToggle = geocodePos > togglePos && geocodePos !== -1;
console.log('3. onGeocodeSearch inside toggleTracking:', insideToggle);

// Show lines around toggle tracking
const toggleLines = content.substring(0, togglePos).split('\n').length;
const geocodeLines = content.substring(0, geocodePos).split('\n').length;
console.log('4. toggleTracking line:', toggleLines);
console.log('5. onGeocodeSearch line:', geocodeLines);
console.log('6. Lines between:', geocodeLines - toggleLines);

// Check for nested functions inside toggleTracking
const toggleStart = content.indexOf('function toggleTracking()');
const toggleEnd = content.indexOf('}', toggleStart);
const toggleBody = content.substring(toggleStart, toggleEnd);
console.log('7. toggleTracking body has async function:', toggleBody.includes('async function'));
