<!-- 1.8 Tu zona: sectores del servidor y creación de la cuenta. -->
<script>
  import { onMount } from 'svelte';
  import { app, datos } from '../../estado.svelte.js';
  import { load, save } from '../../storage.js';
  import { cargarSectoresPublicos, entrar, registrar } from '../../acciones.js';
  import { get } from '../../api/cliente.js';
  import Btn from '../../ui/Btn.svelte';
  import H1 from '../../ui/H1.svelte';
  import Header from '../../ui/Header.svelte';
  import LinkBtn from '../../ui/LinkBtn.svelte';
  import Pills from '../../ui/Pills.svelte';
  import Screen from '../../ui/Screen.svelte';
  import Sub from '../../ui/Sub.svelte';
  import Progreso from './Progreso.svelte';

  const draft = load('registro', {});
  let sectorId = $state(datos.sectors[0]?.id ?? '');
  let manzana = $state('');
  let error = $state('');
  let enviando = $state(false);
  let buscandoZona = $state(false);
  let zonaSugerida = $state('');
  const sector = $derived(datos.sectors.find((s) => s.id === sectorId));

  onMount(async () => {
    try {
      const lista = await cargarSectoresPublicos();
      if (!sectorId && lista[0]) sectorId = lista[0].id;
      const lat = draft.lat_aprox ?? draft.location?.lat;
      const lng = draft.lng_aprox ?? draft.location?.lng;
      if (lat != null && lng != null) {
        buscandoZona = true;
        try {
          const sugerido = await get(`/sectores/buscar?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`);
          if (sugerido?.id) {
            sectorId = sugerido.id;
            zonaSugerida = sugerido.nombre || '';
          }
        } catch {
          // sin match o sin conexión: selección manual
        } finally {
          buscandoZona = false;
        }
      }
    } catch (e) {
      error = e.message;
    }
  });

  async function confirmar() {
    enviando = true;
    try {
      const r = await registrar(draft, { sectorId, manzana });
      save('registro', {});
      await entrar(r.usuario, 'bienvenida');
    } catch (e) {
      error = e.message;
    } finally {
      enviando = false;
    }
  }
</script>

<Screen>
  <Header title="Paso 5 de 5" />
  <Progreso paso={5} />
  <H1>📍 Elige tu zona</H1>
  <Sub>{draft.lat_aprox != null || draft.location ? 'Usamos tu ubicación aproximada para sugerir tu sector.' : 'Elige el sector donde vives.'}</Sub>
  {#if buscandoZona}
    <p class="text-sm font-bold text-petroleo">Buscando tu sector más cercano…</p>
  {:else if zonaSugerida}
    <div class="rounded-2xl bg-petroleo-claro p-3 text-sm font-bold text-petroleo-osc">Sector sugerido por tu ubicación: {zonaSugerida}</div>
  {/if}
  <div class="flex flex-col gap-2" role="radiogroup">
    {#each datos.sectors as s (s.id)}
      <button
        type="button"
        role="radio"
        aria-checked={sectorId === s.id}
        onclick={() => {
          sectorId = s.id;
          manzana = '';
        }}
        class="flex min-h-[56px] items-center justify-between rounded-2xl border-2 px-4 text-left font-bold {sectorId === s.id ? 'border-petroleo bg-petroleo-claro' : 'border-linea bg-white'}">
        {s.name}
        <span class="text-xs font-semibold text-gris">{s.manzanas.length} manzanas</span>
      </button>
    {/each}
  </div>
  {#if sector}
    <div class="text-sm font-extrabold text-gris">¿En qué manzana vives?</div>
    <Pills options={sector.manzanas.map((m) => ({ id: m, label: `Mz. ${m}` }))} value={manzana} onChange={(m) => (manzana = m)} />
  {/if}
  {#if error}<p class="text-sm font-bold text-morado-osc">{error}</p>{/if}
  <LinkBtn onclick={() => app.go('crearSector')}>Mi sector no aparece: crearlo</LinkBtn>
  <div class="flex-1"></div>
  <Btn disabled={!sectorId || !manzana || enviando} onclick={confirmar}>{enviando ? 'Creando tu cuenta…' : 'Confirmar mi zona'}</Btn>
</Screen>
