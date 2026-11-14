<!-- 0.4–0.5 Crear sector (el fundador es el primer Guardián: lo hace el servidor). -->
<script>
  import { load, save } from '../../storage.js';
  import { entrar, registrar } from '../../acciones.js';
  import Btn from '../../ui/Btn.svelte';
  import Field from '../../ui/Field.svelte';
  import Header from '../../ui/Header.svelte';
  import Input from '../../ui/Input.svelte';
  import Pills from '../../ui/Pills.svelte';
  import Screen from '../../ui/Screen.svelte';

  const LETRAS = 'ABCDEFGHIJ'.split('');
  let name = $state('');
  let cantidad = $state('6');
  let manzana = $state('');
  let error = $state('');
  let enviando = $state(false);
  const letras = $derived(LETRAS.slice(0, Number(cantidad)));

  async function crear() {
    enviando = true;
    try {
      const r = await registrar(load('registro', {}), { sectorNuevo: { name: name.trim(), manzanas: letras }, manzana });
      save('registro', {});
      await entrar(r.usuario, 'primerGuardian');
    } catch (e) {
      error = e.message;
    } finally {
      enviando = false;
    }
  }
</script>

<Screen>
  <Header title="Nuevo sector" />
  <div class="rounded-[20px] bg-morado-claro p-4">
    <div class="text-lg font-black text-morado-osc">🧭 Tu zona aún no está en AYNI</div>
    <div class="text-sm font-semibold text-morado-osc">¡Sé el primero en abrirla! Tus vecinos podrán unirse después y tú serás su primer Guardián.</div>
  </div>
  <Field label="Nombre del sector"><Input bind:value={name} placeholder="Ej: Los Jardines · Sector 3" /></Field>
  <Field label="¿Cuántas manzanas tiene tu sector?" grupo>
    <Pills
      options={['4', '6', '8', '10']}
      value={cantidad}
      onChange={(v) => {
        cantidad = v;
        manzana = '';
      }} />
  </Field>
  <Field label="¿En cuál vives?" grupo>
    <Pills options={letras.map((m) => ({ id: m, label: m }))} value={manzana} onChange={(m) => (manzana = m)} />
  </Field>
  {#if error}<p class="text-sm font-bold text-morado-osc">{error}</p>{/if}
  <div class="flex-1"></div>
  <Btn variant="acento" disabled={name.trim().length < 3 || !manzana || enviando} onclick={crear}>{enviando ? 'Creando…' : 'Crear sector'}</Btn>
</Screen>
