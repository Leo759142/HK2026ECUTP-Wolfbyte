<!-- 5.5 Ofrezco producto o servicio -->
<script>
  import { app } from '../../estado.svelte.js';
  import { CATEGORIAS } from '../../data.js';
  import Field from '../../ui/Field.svelte';
  import H1 from '../../ui/H1.svelte';
  import Header from '../../ui/Header.svelte';
  import Input from '../../ui/Input.svelte';
  import PhotoPicker from '../../ui/PhotoPicker.svelte';
  import Screen from '../../ui/Screen.svelte';
  import Segmented from '../../ui/Segmented.svelte';
  import Select from '../../ui/Select.svelte';
  import TextArea from '../../ui/TextArea.svelte';
  import Toggle from '../../ui/Toggle.svelte';
  import Pie from './Pie.svelte';

  let { item, onSave, onBack, editando } = $props();
  let clase = $state(item?.clase ?? 'servicio');
  let categoria = $state(item?.categoria ?? 'gasfiteria');
  let titulo = $state(item?.titulo ?? '');
  let descripcion = $state(item?.descripcion ?? '');
  let horario = $state(item?.horario ?? '');
  let precio = $state(item?.precio ?? '');
  let foto = $state(item?.foto ?? null);
  let showFullName = $state(item?.showFullName ?? false);
  const valido = $derived(titulo.trim().length >= 3 && descripcion.trim().length >= 10 && horario.trim().length >= 2);
</script>

<Screen class="gap-3">
  <Header title={editando ? 'Editar' : 'Clic 2 de 3'} {onBack} />
  <H1>Ofrezco producto o servicio</H1>
  <Segmented
    options={[
      { id: 'servicio', label: 'Servicio', icon: 'fa-screwdriver-wrench' },
      { id: 'producto', label: 'Producto', icon: 'fa-bag-shopping' },
    ]}
    value={clase}
    onChange={(v) => (clase = v)} />
  <Field label="Categoría">
    <Select bind:value={categoria}>
      {#each CATEGORIAS as c (c.id)}<option value={c.id}>{c.emoji} {c.label}</option>{/each}
    </Select>
  </Field>
  <Field label={clase === 'servicio' ? '¿Cómo te presentas? (nombre corto)' : '¿Qué vendes? (nombre corto)'}>
    <Input bind:value={titulo} maxlength={40} placeholder={clase === 'servicio' ? 'Ej: Gasfitero' : 'Ej: Panes caseros'} />
  </Field>
  <Field label="Describe lo que ofreces">
    <TextArea bind:value={descripcion} maxlength={200} placeholder="Ej: Arreglo fugas, termas y desagües. 12 años de experiencia." />
  </Field>
  <div class="grid grid-cols-2 gap-2.5">
    <Field label="Horario"><Input bind:value={horario} placeholder="Lun–Sáb, 8am–6pm" /></Field>
    <Field label="Precio desde (opcional)"><Input bind:value={precio} placeholder="S/ 30" /></Field>
  </div>
  <PhotoPicker value={foto} onChange={(v) => (foto = v)} />
  <Toggle checked={showFullName} onChange={(v) => (showFullName = v)} label="Mostrar mi nombre completo ({app.user.firstName} {app.user.lastName})" hint="Ayuda a que te encuentren y generen confianza" />
  <Pie
    {editando}
    {valido}
    onclick={() => onSave('services', { clase, categoria, titulo: titulo.trim(), descripcion: descripcion.trim(), horario: horario.trim(), precio: precio.trim(), foto, showFullName })} />
</Screen>
