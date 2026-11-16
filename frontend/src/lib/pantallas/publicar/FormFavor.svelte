<!-- 5.6–5.8 Ofrezco un favor: Presto · Regalo · Intercambio -->
<script>
  import Field from '../../ui/Field.svelte';
  import H1 from '../../ui/H1.svelte';
  import Header from '../../ui/Header.svelte';
  import Input from '../../ui/Input.svelte';
  import PhotoPicker from '../../ui/PhotoPicker.svelte';
  import Pills from '../../ui/Pills.svelte';
  import Screen from '../../ui/Screen.svelte';
  import Segmented from '../../ui/Segmented.svelte';
  import Pie from './Pie.svelte';

  let { item, onSave, onBack, editando } = $props();

  let tipo = $state('presto');
  let que = $state('');
  let duracion = $state('1 día');
  let condicion = $state('');
  let estado = $state('Usado');
  let cantidad = $state('');
  let ofrezco = $state('');
  let busco = $state('');
  let foto = $state(null);

  $effect(() => {
    const d = item?.detalles ?? {};
    tipo = item?.tipo ?? 'presto';
    que = item && item.tipo !== 'intercambio' ? item.titulo : '';
    duracion = d.duracion ?? '1 día';
    condicion = d.condicion ?? '';
    estado = d.estado ?? 'Usado';
    cantidad = d.cantidad ?? '';
    ofrezco = d.ofrezco ?? '';
    busco = d.busco ?? '';
    foto = item?.foto ?? null;
  });

  const valido = $derived(
    tipo === 'intercambio'
      ? ofrezco.trim().length >= 3 && busco.trim().length >= 3
      : que.trim().length >= 3
  );

  function publicar() {
    const base = { tipo, foto };
    if (tipo === 'presto') return onSave('favors', { ...base, titulo: que.trim(), detalles: { duracion, condicion: condicion.trim() } });
    if (tipo === 'regalo') return onSave('favors', { ...base, titulo: que.trim(), detalles: { estado, cantidad: cantidad.trim() } });
    return onSave('favors', { ...base, titulo: `${ofrezco.trim()} a cambio de ${busco.trim()}`, detalles: { ofrezco: ofrezco.trim(), busco: busco.trim() } });
  }
</script>

<Screen class="gap-3">
  <Header title={editando ? 'Editar' : 'Clic 2 de 3'} {onBack} />
  <H1>Ofrezco un favor</H1>
  <Segmented
    options={[
      { id: 'presto', label: '🔨 Presto' },
      { id: 'regalo', label: '🎁 Regalo' },
      { id: 'intercambio', label: '🔄 Intercambio' },
    ]}
    value={tipo}
    onChange={(v) => (tipo = v)} />
  {#if tipo === 'presto'}
    <Field label="¿Qué prestas?"><Input bind:value={que} placeholder="Ej: Escalera de 3 metros" /></Field>
    <Field label="¿Por cuánto tiempo?" grupo><Pills options={['Unas horas', '1 día', 'Varios días']} value={duracion} onChange={(v) => (duracion = v)} /></Field>
    <Field label="Condición (opcional)"><Input bind:value={condicion} placeholder="Ej: Devolverla limpia, por favor 🙏" /></Field>
  {:else if tipo === 'regalo'}
    <Field label="¿Qué regalas?"><Input bind:value={que} placeholder="Ej: Ladrillos y una bolsa de cemento" /></Field>
    <Field label="¿En qué estado está?" grupo><Pills options={['Nuevo', 'Usado', 'Sobrante']} value={estado} onChange={(v) => (estado = v)} /></Field>
    <Field label="Cantidad (opcional)"><Input bind:value={cantidad} placeholder="Ej: 20 ladrillos, 1 bolsa" /></Field>
  {:else}
    <Field label="Lo que ofrezco"><Input bind:value={ofrezco} placeholder="Ej: Clases de Excel (2 horas)" /></Field>
    <div class="text-center text-2xl text-morado" aria-hidden="true">🔄</div>
    <Field label="Lo que busco a cambio"><Input bind:value={busco} placeholder="Ej: Que me enseñen a hacer pan" /></Field>
  {/if}
  <PhotoPicker value={foto} onChange={(v) => (foto = v)} />
  <Pie {editando} {valido} onclick={publicar} />
</Screen>
