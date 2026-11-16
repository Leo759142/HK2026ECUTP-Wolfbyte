/* ==================================================================
 *  AYNI · Debug store para estado global de debug console
 * ===================================================================== */

import { writable } from 'svelte/store';

export const debugOpen = writable(false);

export function toggleDebug() {
  debugOpen.update(v => !v);
}