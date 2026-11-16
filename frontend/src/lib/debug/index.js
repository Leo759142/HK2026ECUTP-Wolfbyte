/* ==================================================================
 *  AYNI · Debug module exports
 * ===================================================================== */

export { logger, LOG_LEVELS, CATEGORIES, logAuth, logSync, logNetwork, logRender, logStorage, logApi } from './logger.js';
export { default as ErrorBoundary } from './ErrorBoundary.svelte';
export { default as DebugConsole } from './DebugConsole.svelte';
export { debugOpen, toggleDebug } from './store.js';