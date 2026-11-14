

export const index = 1;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/error.svelte.js')).default;
export const imports = ["_app/immutable/nodes/1.F6OsjNb6.js","_app/immutable/chunks/Ov_AgsIi.js","_app/immutable/chunks/ChmR6GNB.js","_app/immutable/entry/payload.DSmR2FwN.js"];
export const stylesheets = [];
export const fonts = [];
