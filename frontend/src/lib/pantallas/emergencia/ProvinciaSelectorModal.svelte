<script>
  import { onMount } from 'svelte';
  import { get } from '../../api/cliente.js';

  let { open = false, onClose = () => {}, onSelect = () => {} } = $props();

  const FASE1_IDS = new Set(['1501', '0701', '1502']);
  const FALLBACK_PROVINCIAS = [
    { id: '1501', nombre: 'Lima', departamento: 'Lima', lat: -12.046374, lng: -77.042793, fase1: true, x: 520, y: 690, r1: 48, r2: 22 },
    { id: '0701', nombre: 'Callao', departamento: 'Callao', lat: -12.05659, lng: -77.11814, fase1: true, x: 492, y: 675, r1: 28, r2: 14 },
    { id: '1502', nombre: 'Lima Provincias', departamento: 'Lima', lat: -11.85, lng: -76.45, fase1: true, x: 555, y: 655, r1: 42, r2: 20 },
    { id: '0401', nombre: 'Arequipa', departamento: 'Arequipa', lat: -16.409047, lng: -71.537451, fase1: false, x: 610, y: 930, r1: 36, r2: 18 },
    { id: '0801', nombre: 'Cusco', departamento: 'Cusco', lat: -13.53195, lng: -71.967463, fase1: false, x: 640, y: 790, r1: 34, r2: 17 },
    { id: '1301', nombre: 'Trujillo', departamento: 'La Libertad', lat: -8.109052, lng: -79.021534, fase1: false, x: 430, y: 470, r1: 30, r2: 15 },
    { id: '1401', nombre: 'Chiclayo', departamento: 'Lambayeque', lat: -6.77137, lng: -79.84088, fase1: false, x: 400, y: 400, r1: 28, r2: 14 },
    { id: '2001', nombre: 'Piura', departamento: 'Piura', lat: -5.19449, lng: -80.63282, fase1: false, x: 350, y: 320, r1: 30, r2: 15 },
    { id: '1201', nombre: 'Huancayo', departamento: 'Junín', lat: -12.06513, lng: -75.20486, fase1: false, x: 560, y: 720, r1: 28, r2: 14 },
    { id: '1601', nombre: 'Iquitos', departamento: 'Loreto', lat: -3.743673, lng: -73.251632, fase1: false, x: 620, y: 220, r1: 40, r2: 20 },
    { id: '2301', nombre: 'Tacna', departamento: 'Tacna', lat: -18.01465, lng: -70.25362, fase1: false, x: 650, y: 1040, r1: 26, r2: 13 },
    { id: '2101', nombre: 'Puno', departamento: 'Puno', lat: -15.840221, lng: -70.021881, fase1: false, x: 700, y: 900, r1: 30, r2: 15 },
  ];

  let fase = $state(1);
  let provincias = $state([...FALLBACK_PROVINCIAS]);
  let distritos = $state([]);
  let provinciaSel = $state(null);
  let distritoSel = $state('');
  let cargando = $state(false);
  let error = $state('');

  const visibles = $derived(fase === 1 ? provincias.filter((p) => p.fase1 || FASE1_IDS.has(p.id)) : provincias);

  async function cargar() {
    cargando = true;
    error = '';
    try {
      const data = await get('/provincias');
      if (Array.isArray(data) && data.length) {
        provincias = data.map((p) => ({ ...p, fase1: Boolean(p.fase1 ?? FASE1_IDS.has(p.id)), x: p.x ?? 520, y: p.y ?? 700, r1: p.r1 ?? 30, r2: p.r2 ?? 15 }));
      }
    } catch {
      // fallback local
    } finally {
      cargando = false;
    }
  }

  async function elegirProvincia(p) {
    provinciaSel = p;
    distritoSel = '';
    distritos = [];
    if (fase === 1) fase = 2;
    try {
      const ds = await get(`/provincias/${p.id}/distritos`);
      distritos = Array.isArray(ds) ? ds : [];
    } catch {
      distritos = [];
    }
  }

  function confirmar() {
    if (!provinciaSel) return;
    const d = distritos.find((x) => String(x.id) === String(distritoSel));
    const lat = d?.lat ?? provinciaSel.lat;
    const lng = d?.lng ?? provinciaSel.lng;
    onSelect({
      provinciaId: provinciaSel.id,
      provinciaNombre: provinciaSel.nombre,
      distritoId: d?.id ?? null,
      distritoNombre: d?.nombre ?? null,
      lat_aprox: lat != null ? Number(Number(lat).toFixed(3)) : null,
      lng_aprox: lng != null ? Number(Number(lng).toFixed(3)) : null,
    });
    onClose();
  }

  $effect(() => {
    if (open) {
      fase = 1;
      provinciaSel = null;
      distritoSel = '';
      distritos = [];
      cargar();
    }
  });
</script>

{#if open}
  <div class="fixed inset-0 z-50 flex items-end justify-center bg-negro/50 p-3 sm:items-center" role="dialog" aria-modal="true" aria-label="Selecciona tu provincia o distrito">
    <div class="max-h-[92dvh] w-full max-w-xl overflow-auto rounded-3xl border border-linea bg-white p-4 shadow-xl">
      <div class="mb-2 flex items-start justify-between gap-3">
        <div>
          <div class="text-lg font-black">Ubicación aproximada (Perú)</div>
          <div class="text-sm font-semibold text-gris">
            {fase === 1 ? 'Fase 1: elige una zona principal.' : 'Fase 2: ajusta provincia y distrito (círculos aproximados).'}
          </div>
        </div>
        <button type="button" class="rounded-xl px-2 py-1 text-sm font-extrabold text-gris" onclick={onClose}>✕</button>
      </div>

      {#if error}<div class="mb-2 rounded-xl bg-rojo-claro p-2 text-sm font-bold text-rojo-osc">{error}</div>{/if}

      <div class="overflow-hidden rounded-2xl border border-linea bg-[#f4fbfc]">
        <svg viewBox="300 150 450 950" class="h-[320px] w-full">
          <rect x="300" y="150" width="450" height="950" fill="#eef8fa" />
          <path d="M420,220 C500,200 620,260 650,360 C700,470 690,620 640,760 C600,860 560,960 620,1080 C560,1060 500,980 470,900 C430,780 360,700 380,560 C400,430 360,330 420,220 Z" fill="#d8ecef" stroke="#9ec9cf" />
{#each visibles as p (p.id)}
            <g>
              <circle
                tabindex="0"
                role="button"
                aria-label={p.nombre}
                onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); elegirProvincia(p); } }}
                cx={p.x}
                cy={p.y}
                r={fase === 1 ? p.r1 : p.r2}
                fill={provinciaSel?.id === p.id ? '#0F4C5C' : '#5FA8B5'}
                fill-opacity={provinciaSel?.id === p.id ? 0.35 : 0.22}
                stroke={provinciaSel?.id === p.id ? '#0F4C5C' : '#2f7f8c'}
                stroke-width="3"
                class="cursor-pointer"
                onclick={() => elegirProvincia(p)}
              />
              <text x={p.x} y={p.y - (fase === 1 ? p.r1 : p.r2) - 6} text-anchor="middle" font-size="18" font-weight="700" fill="#103f49">{p.nombre}</text>
            </g>
          {/each}
        </svg>
      </div>

      <div class="mt-3 flex flex-col gap-2">
        {#if cargando}<p class="text-sm font-bold text-petroleo">Cargando provincias…</p>{/if}
        <div class="flex flex-wrap gap-2">
          {#each (fase === 1 ? visibles : provincias) as p (p.id)}
            <button type="button" class="rounded-xl border-2 px-3 py-2 text-sm font-bold {provinciaSel?.id === p.id ? 'border-petroleo bg-petroleo-claro text-petroleo-osc' : 'border-linea bg-white'}" onclick={() => elegirProvincia(p)}>{p.nombre}</button>
          {/each}
        </div>

        {#if provinciaSel}
          <div class="rounded-2xl border border-linea p-3">
            <div class="mb-2 text-sm font-extrabold">Provincia: {provinciaSel.nombre}</div>
            <label class="text-sm font-bold text-gris" for="dist-emg">Distrito (opcional)</label>
            <select id="dist-emg" bind:value={distritoSel} class="mt-1 min-h-[44px] w-full rounded-xl border-2 border-linea bg-white px-3 font-semibold">
              <option value="">Centro aproximado de provincia</option>
              {#each distritos as d (d.id)}
                <option value={d.id}>{d.nombre}</option>
              {/each}
            </select>
            {#if distritos.length === 0}
              <p class="mt-1 text-xs font-semibold text-gris">Si no hay lista de distritos disponible, se usará el centro aproximado de la provincia.</p>
            {/if}
          </div>
        {/if}
      </div>

      <div class="mt-3 flex gap-2">
        {#if fase === 2}
          <button type="button" class="flex-1 rounded-2xl border-2 border-linea py-3 font-black" onclick={() => (fase = 1)}>Ver fase 1</button>
        {/if}
        <button type="button" class="flex-1 rounded-2xl bg-petroleo py-3 font-black text-white disabled:opacity-50" disabled={!provinciaSel} onclick={confirmar}>Usar esta ubicación</button>
      </div>
    </div>
  </div>
{/if}
