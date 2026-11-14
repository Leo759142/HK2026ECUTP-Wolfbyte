<!-- 1.8 Tu zona: sectores del servidor y creación de la cuenta. -->
<script>
  import { onMount } from 'svelte';
  import { app, datos } from '../../estado.svelte.js';
  import { load, save } from '../../storage.js';
  import { cargarSectoresPublicos, entrar, registrar } from '../../acciones.js';
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
  const sector = $derived(datos.sectors.find((s) => s.id === sectorId));

  onMount(async () => {
    try {
      const lista = await cargarSectoresPublicos();
      if (!sectorId && lista[0]) sectorId = lista[0].id;
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
  <Header title="Paso 4 de 4" />
  <Progreso paso={4} />
  <H1>📍 Elige tu zona</H1>
  <Sub>{draft.location ? 'Estos sectores están cerca de tu ubicación.' : 'Elige el sector donde vives.'}</Sub>
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
