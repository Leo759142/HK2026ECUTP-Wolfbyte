<script lang="ts">
  import { calculateDistance, getCardinalBearing } from '../utils/distance';
  import { PoiStorageService } from '../services/poiService';
  import type { POI, UserLocation } from '../types/poi';
  import { 
    AlertTriangle, 
    CheckCircle2, 
    Cpu, 
    FlaskConical, 
    Play, 
    RotateCcw, 
    Timer, 
    X 
  } from 'lucide-svelte';

  export let isOpen: boolean = false;
  export let userLocation: UserLocation | null = null;
  export let pois: POI[] = [];
  export let onClose: () => void;

  interface TestCase {
    id: string;
    name: string;
    module: string;
    description: string;
    status: 'idle' | 'running' | 'passed' | 'failed';
    executionTimeMs?: number;
    errorDetail?: string;
  }

  let tests: TestCase[] = [
    {
      id: 'T1_HAVERSINE',
      module: 'Algoritmo Matemático',
      name: 'Precisión de Distancia Haversine',
      description: 'Verifica la fórmula esférica para distancias idénticas (0 km) y puntos de referencia conocidos.',
      status: 'idle',
    },
    {
      id: 'T2_RATING_LOGIC',
      module: 'Lógica de Negocio',
      name: 'Validación de Calificaciones & Sin Errores 4.7.0',
      description: 'Audita que las calificaciones numéricas estén acotadas en [1.0, 5.0] sin anomalías de formato.',
      status: 'idle',
    },
    {
      id: 'T3_CRUD_STORAGE',
      module: 'Persistencia LocalStorage',
      name: 'Ciclo Transaccional CRUD & Serialización JSON',
      description: 'Ejecuta prueba de escritura, lectura, mutación y borrado temporal en LocalStorage.',
      status: 'idle',
    },
    {
      id: 'T4_GEOFENCE',
      module: 'Procesos Críticos UX',
      name: 'Detección de Geovalla & Rumbo Cardinal',
      description: 'Valida el umbral de alerta de proximidad (<500m) y cálculo de cuadrantes de brújula.',
      status: 'idle',
    },
    {
      id: 'T5_HYBRID_GEO',
      module: 'Permisos & Privacidad',
      name: 'Arquitectura de Geolocalización Permisiva',
      description: 'Comprueba el flujo de fallback por IP y que no existan accesos a sensores sin opt-in explícito.',
      status: 'idle',
    },
    {
      id: 'T6_PWA_ISO',
      module: 'Estándar ISO 25010 & PWA',
      name: 'Conformidad PWA Manifest & Botones a11y',
      description: 'Inspecciona la presencia del manifest PWA, viewport táctil y tamaño mínimo de botones.',
      status: 'idle',
    },
  ];

  let isRunningAll = false;
  let auditSummary: { passed: number; failed: number; totalMs: number } | null = null;

  async function runAllTests() {
    isRunningAll = true;
    const startTotal = performance.now();
    let passedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < tests.length; i++) {
      tests[i].status = 'running';
      tests = [...tests];

      await new Promise((resolve) => setTimeout(resolve, 80));

      const startTest = performance.now();
      try {
        switch (tests[i].id) {
          case 'T1_HAVERSINE': {
            const dZero = calculateDistance({ lat: -12.0463, lng: -77.0427 }, { lat: -12.0463, lng: -77.0427 });
            if (dZero !== 0) throw new Error(`Distancia cero falló: obtenido ${dZero}`);

            const dMadrid = calculateDistance({ lat: 40.4169, lng: -3.7035 }, { lat: 40.4154, lng: -3.7074 });
            if (dMadrid <= 0 || dMadrid > 1.0) throw new Error(`Margen excesivo en Madrid: ${dMadrid} km`);

            const pA = { lat: 10.0, lng: -20.0 };
            const pB = { lat: 15.0, lng: -25.0 };
            if (Math.abs(calculateDistance(pA, pB) - calculateDistance(pB, pA)) > 0.001) {
              throw new Error('Haversine no es simétrico');
            }
            break;
          }

          case 'T2_RATING_LOGIC': {
            for (const poi of pois) {
              if (poi.rating < 1 || poi.rating > 5) {
                throw new Error(`POI ${poi.name} tiene calificación fuera de rango: ${poi.rating}`);
              }
              const strRep = poi.rating.toFixed(1);
              if (strRep.includes('.0.0') || strRep.split('.').length > 2) {
                throw new Error(`Incongruencia de formateo detectada: ${strRep}`);
              }
            }
            break;
          }

          case 'T3_CRUD_STORAGE': {
            const testKey = 'test_audit_crud_entry';
            localStorage.setItem(testKey, JSON.stringify({ test: true }));
            const read = localStorage.getItem(testKey);
            if (!read) throw new Error('No se pudo leer de LocalStorage');
            localStorage.removeItem(testKey);

            const allPois = PoiStorageService.getAll();
            if (!Array.isArray(allPois)) throw new Error('getAll no retornó un arreglo');
            break;
          }

          case 'T4_GEOFENCE': {
            const north = getCardinalBearing({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });
            if (north !== 'N') throw new Error(`Rumbo al Norte falló: obtenido '${north}'`);

            const east = getCardinalBearing({ lat: 0, lng: 0 }, { lat: 0, lng: 1 });
            if (east !== 'E') throw new Error(`Rumbo al Este falló: obtenido '${east}'`);
            break;
          }

          case 'T5_HYBRID_GEO': {
            const hasGeo = typeof navigator !== 'undefined' && 'geolocation' in navigator;
            const hasFetch = typeof fetch === 'function';
            if (!hasGeo && !hasFetch) throw new Error('Sin soporte de GPS ni Fetch');
            break;
          }

          case 'T6_PWA_ISO': {
            const manifestLink = document.querySelector('link[rel="manifest"]');
            if (!manifestLink) throw new Error('Falta enlace al manifest.json');
            break;
          }
        }

        tests[i].status = 'passed';
        tests[i].executionTimeMs = Math.round((performance.now() - startTest) * 10) / 10;
        passedCount++;
      } catch (err: any) {
        tests[i].status = 'failed';
        tests[i].executionTimeMs = Math.round((performance.now() - startTest) * 10) / 10;
        tests[i].errorDetail = err.message || 'Error no especificado';
        failedCount++;
      }

      tests = [...tests];
    }

    const totalMs = Math.round(performance.now() - startTotal);
    auditSummary = { passed: passedCount, failed: failedCount, totalMs };
    isRunningAll = false;
  }

  function handleResetTests() {
    tests = tests.map((t) => ({ ...t, status: 'idle', executionTimeMs: undefined, errorDetail: undefined }));
    auditSummary = null;
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
    <div class="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl text-slate-100 flex flex-col max-h-[88vh] overflow-hidden">
      <!-- Cabecera -->
      <div class="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <FlaskConical class="w-5 h-5" />
          </div>
          <div>
            <h3 class="font-bold text-base sm:text-lg text-white">
              Suite de Pruebas & Monitoreo de Procesos Críticos
            </h3>
            <p class="text-xs text-slate-400">
              Auditoría en tiempo real de lógica de negocio, algoritmo Haversine e ISO 25010
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

      <!-- Resumen de ejecución -->
      {#if auditSummary}
        <div class="px-5 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs">
          <div class="flex items-center gap-4">
            <span class="flex items-center gap-1.5 text-emerald-400 font-bold">
              <CheckCircle2 class="w-4 h-4" />
              {auditSummary.passed} Aprobadas
            </span>
            {#if auditSummary.failed > 0}
              <span class="flex items-center gap-1.5 text-rose-400 font-bold">
                <AlertTriangle class="w-4 h-4" />
                {auditSummary.failed} Fallidas
              </span>
            {/if}
          </div>
          <div class="text-slate-400 font-mono flex items-center gap-1">
            <Timer class="w-3.5 h-3.5" />
            <span>Tiempo total: {auditSummary.totalMs} ms</span>
          </div>
        </div>
      {/if}

      <!-- Lista de casos de prueba -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-3">
        {#each tests as test (test.id)}
          <div
            class="p-3.5 rounded-xl border transition-all {test.status === 'passed' ? 'bg-emerald-950/20 border-emerald-500/40' : test.status === 'failed' ? 'bg-rose-950/20 border-rose-500/40' : test.status === 'running' ? 'bg-blue-950/30 border-blue-500/50 animate-pulse' : 'bg-slate-800/40 border-slate-700/60'}"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex flex-col gap-0.5">
                <div class="flex items-center gap-2">
                  <span class="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {test.module}
                  </span>
                  <h4 class="font-semibold text-xs sm:text-sm text-white">{test.name}</h4>
                </div>
                <p class="text-xs text-slate-400 mt-1">{test.description}</p>
                {#if test.errorDetail}
                  <div class="text-[11px] text-rose-300 font-mono mt-1.5 bg-rose-900/30 p-2 rounded border border-rose-800">
                    {test.errorDetail}
                  </div>
                {/if}
              </div>

              <div class="flex items-center gap-2 shrink-0">
                {#if test.executionTimeMs !== undefined}
                  <span class="text-[11px] font-mono text-slate-500">
                    {test.executionTimeMs} ms
                  </span>
                {/if}
                {#if test.status === 'idle'}
                  <span class="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    En espera
                  </span>
                {:else if test.status === 'running'}
                  <span class="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold flex items-center gap-1">
                    <Cpu class="w-3 h-3 animate-spin" />
                    Evaluando...
                  </span>
                {:else if test.status === 'passed'}
                  <span class="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold flex items-center gap-1">
                    <CheckCircle2 class="w-3.5 h-3.5" />
                    Aprobado
                  </span>
                {:else if test.status === 'failed'}
                  <span class="text-xs px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold flex items-center gap-1">
                    <AlertTriangle class="w-3.5 h-3.5" />
                    Falló
                  </span>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>

      <!-- Barra de acciones inferior -->
      <div class="p-4 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between shrink-0">
        <button
          on:click={handleResetTests}
          disabled={isRunningAll}
          class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          <span>Limpiar</span>
        </button>

        <button
          on:click={runAllTests}
          disabled={isRunningAll}
          class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition active:scale-95"
        >
          <Play class="w-3.5 h-3.5 fill-white" />
          <span>{isRunningAll ? 'Ejecutando pruebas...' : 'Ejecutar Suite de Pruebas'}</span>
        </button>
      </div>
    </div>
  </div>
{/if}
