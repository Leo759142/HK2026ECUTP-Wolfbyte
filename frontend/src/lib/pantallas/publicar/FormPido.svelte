<!-- 5.9 Necesito ayuda (Pido) -->
<script>
  import Field from '../../ui/Field.svelte';
  import H1 from '../../ui/H1.svelte';
  import Header from '../../ui/Header.svelte';
  import PhotoPicker from '../../ui/PhotoPicker.svelte';
  import Pills from '../../ui/Pills.svelte';
  import Screen from '../../ui/Screen.svelte';
  import Sub from '../../ui/Sub.svelte';
  import TextArea from '../../ui/TextArea.svelte';
  import Pie from './Pie.svelte';

  let { item, onSave, onBack, editando } = $props();

  let clase = $state('Favor');
  let texto = $state('');
  let cuando = $state('Hoy');
  let foto = $state(null);

  $effect(() => {
    const d = item?.detalles ?? {};
    clase = d.clase ?? 'Favor';
    texto = item?.titulo ?? '';
    cuando = d.cuando ?? 'Hoy';
    foto = item?.foto ?? null;
  });
</script>

<Screen class="gap-3">
  <Header title={editando ? 'Editar' : 'Clic 2 de 3'} {onBack} />
  <H1>¿Qué necesitas?</H1>
  <Sub>Se publica en la Cadena de Favores. Tus vecinos responden con “Puedo ayudar”.</Sub>
  <Field label="Es un…" grupo>
    <Pills
      options={[
        { id: 'Producto', label: 'Producto', icon: 'fa-bag-shopping' },
        { id: 'Servicio', label: 'Servicio', icon: 'fa-screwdriver-wrench' },
        { id: 'Favor', label: 'Favor', icon: 'fa-handshake' },
      ]}
      value={clase}
      onChange={(v) => (clase = v)} />
  </Field>
  <Field label="Cuéntalo en pocas palabras">
    <TextArea bind:value={texto} maxlength={160} placeholder="Ej: Necesito que alguien me preste un taladro para colgar una repisa." />
  </Field>
  <Field label="¿Para cuándo?" grupo><Pills options={['Hoy', 'Esta semana', 'Sin apuro']} value={cuando} onChange={(v) => (cuando = v)} /></Field>
  <PhotoPicker value={foto} onChange={(v) => (foto = v)} />
  <Pie {editando} valido={texto.trim().length >= 5} onclick={() => onSave('favors', { tipo: 'pido', titulo: texto.trim(), detalles: { clase, cuando }, foto })} />
</Screen>
