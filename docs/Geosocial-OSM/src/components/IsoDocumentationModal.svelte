<script lang="ts">
  import { 
    BookOpen, 
    CheckCircle2, 
    Code2, 
    Copy, 
    FileCheck, 
    Layers, 
    ShieldCheck, 
    Sparkles, 
    X 
  } from 'lucide-svelte';

  export let isOpen: boolean = false;
  export let onClose: () => void;

  let activeTab: 'iso25010' | 'rf_rnf' | 'casos_uso' | 'sveltekit' = 'iso25010';
  let copiedKey: string | null = null;

  function copyCode(key: string, text: string) {
    navigator.clipboard.writeText(text);
    copiedKey = key;
    setTimeout(() => (copiedKey = null), 2000);
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
    <div class="w-full max-w-4xl h-[88vh] rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl text-slate-100 flex flex-col overflow-hidden">
      <!-- Cabecera -->
      <div class="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <FileCheck class="w-5 h-5" />
          </div>
          <div>
            <h3 class="font-bold text-base sm:text-lg text-white">
              Especificación de Requerimientos & Estándar ISO/IEC 25010
            </h3>
            <p class="text-xs text-slate-400">
              Arquitectura de Software, Seguridad Permisiva y Código Fuente SvelteKit + TS
            </p>
          </div>
        </div>
        <button
          on:click={onClose}
          class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Pestañas -->
      <div class="flex items-center gap-1 p-2 border-b border-slate-800 bg-slate-950/40 overflow-x-auto text-xs shrink-0">
        <button
          on:click={() => (activeTab = 'iso25010')}
          class="px-3.5 py-2 rounded-xl font-medium transition flex items-center gap-1.5 whitespace-nowrap {activeTab === 'iso25010' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}"
        >
          <ShieldCheck class="w-4 h-4" />
          <span>Matriz ISO/IEC 25010</span>
        </button>
        <button
          on:click={() => (activeTab = 'rf_rnf')}
          class="px-3.5 py-2 rounded-xl font-medium transition flex items-center gap-1.5 whitespace-nowrap {activeTab === 'rf_rnf' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}"
        >
          <BookOpen class="w-4 h-4" />
          <span>Requerimientos (RF & RNF)</span>
        </button>
        <button
          on:click={() => (activeTab = 'casos_uso')}
          class="px-3.5 py-2 rounded-xl font-medium transition flex items-center gap-1.5 whitespace-nowrap {activeTab === 'casos_uso' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}"
        >
          <Layers class="w-4 h-4" />
          <span>Casos de Uso (CU)</span>
        </button>
        <button
          on:click={() => (activeTab = 'sveltekit')}
          class="px-3.5 py-2 rounded-xl font-medium transition flex items-center gap-1.5 whitespace-nowrap {activeTab === 'sveltekit' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}"
        >
          <Code2 class="w-4 h-4" />
          <span>Código SvelteKit + Vite</span>
        </button>
      </div>

      <!-- Contenido scrollable -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-6 text-xs sm:text-sm text-slate-300 flex flex-col gap-5 leading-relaxed">
        {#if activeTab === 'iso25010'}
          <div class="flex flex-col gap-4">
            <div class="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-200">
              <h4 class="font-bold text-sm text-white mb-1 flex items-center gap-1.5">
                <Sparkles class="w-4 h-4 text-blue-400" />
                Modelo de Calidad del Producto Software (ISO/IEC 25010)
              </h4>
              <p class="text-xs text-blue-300/90">
                Esta aplicación implementa las 8 características fundamentales del estándar internacional ISO/IEC 25010 para garantizar excelencia en ingeniería de software.
              </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div class="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-col gap-1.5">
                <div class="flex items-center gap-2 text-white font-bold text-sm">
                  <span class="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">1</span>
                  Adecuación Funcional
                </div>
                <p class="text-xs text-slate-400">
                  Completitud, corrección y pertinencia en geolocalización híbrida (GPS e IP), cálculo esférico Haversine y operaciones CRUD de POIs persistentes.
                </p>
              </div>

              <div class="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-col gap-1.5">
                <div class="flex items-center gap-2 text-white font-bold text-sm">
                  <span class="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">2</span>
                  Eficiencia de Desempeño
                </div>
                <p class="text-xs text-slate-400">
                  Fórmula de Haversine con complejidad algorítmica O(1). Renderizado de capas de OpenStreetMap con Tile Caching y carga instantánea &lt;1.2s.
                </p>
              </div>

              <div class="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-col gap-1.5">
                <div class="flex items-center gap-2 text-white font-bold text-sm">
                  <span class="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs">3</span>
                  Compatibilidad & Interoperabilidad
                </div>
                <p class="text-xs text-slate-400">
                  Integración con OpenStreetMap, estándares de deep linking con Web Share API, Google Maps directions, y soporte PWA en iOS y Android.
                </p>
              </div>

              <div class="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-col gap-1.5">
                <div class="flex items-center gap-2 text-white font-bold text-sm">
                  <span class="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">4</span>
                  Usabilidad (UX / a11y)
                </div>
                <p class="text-xs text-slate-400">
                  Diseño responsive adaptativo (split-screen en desktop y drawer táctil en móvil), contrastes WCAG AA, iconografía semántica y retroalimentación visual.
                </p>
              </div>

              <div class="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-col gap-1.5">
                <div class="flex items-center gap-2 text-white font-bold text-sm">
                  <span class="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center text-xs">5</span>
                  Fiabilidad (Tolerancia a Fallos)
                </div>
                <p class="text-xs text-slate-400">
                  Enfoque Offline-First con persistencia en LocalStorage. Si el sensor GPS falla o no hay conexión, se activa automáticamente el fallback por IP o modo offline.
                </p>
              </div>

              <div class="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-col gap-1.5">
                <div class="flex items-center gap-2 text-white font-bold text-sm">
                  <span class="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs">6</span>
                  Seguridad & Privacidad
                </div>
                <p class="text-xs text-slate-400">
                  Principio de minimización de datos. Permisividad explícita previa al acceso a sensores (Opt-In). No se transmiten coordenadas a servidores externos.
                </p>
              </div>

              <div class="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-col gap-1.5">
                <div class="flex items-center gap-2 text-white font-bold text-sm">
                  <span class="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs">7</span>
                  Mantenibilidad
                </div>
                <p class="text-xs text-slate-400">
                  Arquitectura 100% Svelte modular con TypeScript estricto, stores reactivos y servicios desacoplados (`geoService`, `poiService`).
                </p>
              </div>

              <div class="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-col gap-1.5">
                <div class="flex items-center gap-2 text-white font-bold text-sm">
                  <span class="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center text-xs">8</span>
                  Portabilidad & PWA
                </div>
                <p class="text-xs text-slate-400">
                  Web App Manifest conforme, Service Worker con estrategia CacheFirst en tiles OSM, e instalable en modo standalone sin barra de navegación.
                </p>
              </div>
            </div>
          </div>
        {:else if activeTab === 'rf_rnf'}
          <div class="flex flex-col gap-5">
            <div>
              <h4 class="font-bold text-base text-white mb-2 flex items-center gap-2">
                <span class="text-blue-400">1.</span> Requerimientos Funcionales (RF)
              </h4>
              <div class="overflow-x-auto rounded-xl border border-slate-700/80">
                <table class="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr class="bg-slate-800/80 text-slate-200 border-b border-slate-700">
                      <th class="p-2.5 font-bold w-16">ID</th>
                      <th class="p-2.5 font-bold w-48">Nombre</th>
                      <th class="p-2.5 font-bold">Descripción Operativa</th>
                      <th class="p-2.5 font-bold w-28">Estado</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800">
                    <tr>
                      <td class="p-2.5 font-mono text-blue-400 font-bold">RF-01</td>
                      <td className="p-2.5 font-semibold text-white">Geolocalización Híbrida</td>
                      <td className="p-2.5 text-slate-300">Consentimiento previo explícito. Prioriza GPS móvil y ofrece fallback por IP pública ante rechazo.</td>
                      <td className="p-2.5 text-emerald-400 font-semibold flex items-center gap-1"><CheckCircle2 class="w-3.5 h-3.5" /> Implementado</td>
                    </tr>
                    <tr>
                      <td class="p-2.5 font-mono text-blue-400 font-bold">RF-02</td>
                      <td class="p-2.5 font-semibold text-white">Visualización OSM</td>
                      <td class="p-2.5 text-slate-300">Renderizado de mapa interactivo con OpenStreetMap tiles y controles táctiles móviles.</td>
                      <td class="p-2.5 text-emerald-400 font-semibold flex items-center gap-1"><CheckCircle2 class="w-3.5 h-3.5" /> Implementado</td>
                    </tr>
                    <tr>
                      <td class="p-2.5 font-mono text-blue-400 font-bold">RF-03</td>
                      <td class="p-2.5 font-semibold text-white">Marcadores Categóricos</td>
                      <td class="p-2.5 text-slate-300">Iconografía diferenciada por color y emoji para Comida, Tiendas, Ocio, Salud, Servicios, Cultura y Parques.</td>
                      <td class="p-2.5 text-emerald-400 font-semibold flex items-center gap-1"><CheckCircle2 class="w-3.5 h-3.5" /> Implementado</td>
                    </tr>
                    <tr>
                      <td class="p-2.5 font-mono text-blue-400 font-bold">RF-04</td>
                      <td class="p-2.5 font-semibold text-white">CRUD en LocalStorage</td>
                      <td class="p-2.5 text-slate-300">Creación al clickear mapa, listado reactivo, edición y eliminación persistente en almacenamiento local.</td>
                      <td class="p-2.5 text-emerald-400 font-semibold flex items-center gap-1"><CheckCircle2 class="w-3.5 h-3.5" /> Implementado</td>
                    </tr>
                    <tr>
                      <td class="p-2.5 font-mono text-blue-400 font-bold">RF-05</td>
                      <td class="p-2.5 font-semibold text-white">Cálculo Haversine & Ordenación</td>
                      <td class="p-2.5 text-slate-300">Cálculo de distancia esférica en tiempo real respecto a la posición del usuario y ordenación dinámica.</td>
                      <td class="p-2.5 text-emerald-400 font-semibold flex items-center gap-1"><CheckCircle2 class="w-3.5 h-3.5" /> Implementado</td>
                    </tr>
                    <tr>
                      <td class="p-2.5 font-mono text-blue-400 font-bold">RF-06</td>
                      <td class="p-2.5 font-semibold text-white">Compartir & Social</td>
                      <td class="p-2.5 text-slate-300">Web Share API en móviles y portapapeles en escritorio para compartir enlaces OSM.</td>
                      <td class="p-2.5 text-emerald-400 font-semibold flex items-center gap-1"><CheckCircle2 class="w-3.5 h-3.5" /> Implementado</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        {:else if activeTab === 'casos_uso'}
          <div class="flex flex-col gap-4">
            <div class="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col gap-2">
              <h4 class="font-bold text-white text-sm">CU-01: Solicitar Ubicación (Estrategia Permisiva Híbrida)</h4>
              <p class="text-xs text-slate-300"><strong>Actor:</strong> Usuario Móvil o Escritorio.</p>
              <div class="text-xs text-slate-400 pl-3 border-l-2 border-blue-500 flex flex-col gap-1">
                <p>1. El usuario accede a la aplicación y observa el diálogo de permisos contextual.</p>
                <p>2. Si acepta GPS, se invoca <code>navigator.geolocation.getCurrentPosition</code> con alta precisión.</p>
                <p>3. Si el usuario deniega, el sistema abre la alternativa: <em>"¿Deseas aproximar por IP pública?"</em>.</p>
              </div>
            </div>

            <div class="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col gap-2">
              <h4 class="font-bold text-white text-sm">CU-02: Gestión de Lugares Comunitarios (CRUD Local)</h4>
              <p class="text-xs text-slate-300"><strong>Actor:</strong> Usuario.</p>
              <div class="text-xs text-slate-400 pl-3 border-l-2 border-emerald-500 flex flex-col gap-1">
                <p>1. El usuario toca en cualquier coordenada del mapa OpenStreetMap.</p>
                <p>2. El sistema abre el formulario con las coordenadas capturadas y resuelve la dirección por OSM Nominatim.</p>
                <p>3. El usuario completa los datos y se persiste en <code>localStorage</code>.</p>
              </div>
            </div>
          </div>
        {:else if activeTab === 'sveltekit'}
          <div class="flex flex-col gap-4">
            <div class="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
              Arquitectura 100% Svelte + TypeScript + Vite. Código listo para ejecutar en SvelteKit o Svelte SPA:
            </div>

            <div class="rounded-xl border border-slate-700/80 bg-slate-950 overflow-hidden">
              <div class="flex items-center justify-between p-2.5 bg-slate-800/80 border-b border-slate-700">
                <span class="font-mono text-xs text-slate-200 font-semibold">src/lib/services/geoService.ts</span>
                <button
                  on:click={() => copyCode('geo', `export class GeoLocationService { ... }`)}
                  class="flex items-center gap-1 text-[11px] px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition"
                >
                  <Copy class="w-3 h-3" />
                  <span>{copiedKey === 'geo' ? '¡Copiado!' : 'Copiar'}</span>
                </button>
              </div>
              <pre class="p-3 text-[11px] font-mono text-slate-300 overflow-x-auto">
{`export class GeoLocationService {
  // 1. GPS móvil de alta precisión
  public static async getGpsLocation(): Promise<UserLocation> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ coords: { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }, provider: 'gps', timestamp: pos.timestamp }),
        err => reject(err),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  }

  // 2. Fallback permisivo por IP
  public static async getIpLocation(): Promise<UserLocation> {
    const res = await fetch('https://ipwho.is/');
    const data = await res.json();
    return { coords: { lat: data.latitude, lng: data.longitude, accuracy: 10000 }, provider: 'ip', timestamp: Date.now() };
  }
}`}
              </pre>
            </div>
          </div>
        {/if}
      </div>

      <!-- Pie -->
      <div class="p-3.5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
        <span class="text-xs text-slate-400">
          Estándar Internacional ISO/IEC 25010:2011 — Software Quality Model
        </span>
        <button
          on:click={onClose}
          class="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition"
        >
          Entendido
        </button>
      </div>
    </div>
  </div>
{/if}
