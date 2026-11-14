<!-- 4.7 Pedir ayuda en emergencia -->
<script>
  import { app } from '../../estado.svelte.js';
  import { NECESIDADES, VULNERABLES, emergenciaById } from '../../data.js';
  import { pedirAyuda } from '../../acciones.js';
  import Btn from '../../ui/Btn.svelte';
  import EmergencyBanner from '../../ui/EmergencyBanner.svelte';
  import Field from '../../ui/Field.svelte';
  import H1 from '../../ui/H1.svelte';
  import Header from '../../ui/Header.svelte';
  import OptionGrid from '../../ui/OptionGrid.svelte';
  import PhotoPicker from '../../ui/PhotoPicker.svelte';
  import Screen from '../../ui/Screen.svelte';
  import Stepper from '../../ui/Stepper.svelte';
  import Sub from '../../ui/Sub.svelte';
  import TextArea from '../../ui/TextArea.svelte';

  const e = $derived(app.activeEmergency);
  let necesidad = $state('');
  let quienes = $state([]);
  let cuantas = $state(1);
  let texto = $state('');
  let foto = $state(null);
  function pedir() {
    const n = pedirAyuda(e, { necesidad, quienes, cuantas, texto: texto.trim(), foto });
    app.replace('miPedido', { id: n.id });
  }
</script>

{#if !e}
  <Screen>
    <Header />
    <H1>No hay una emergencia activa</H1>
    <Sub>Si algo grave está pasando, repórtalo para que un Guardián lo confirme.</Sub>
    <Btn variant="rojo" onclick={() => app.replace('reportarEmergencia')}>Reportar emergencia</Btn>
    <Btn variant="borde" onclick={app.back}>Volver</Btn>
  </Screen>
{:else}
  <div class="flex flex-1 flex-col">
    <EmergencyBanner emergencia={e} tipo={emergenciaById(e.tipo)} />
    <Screen class="gap-3">
      <Header title="Pedir ayuda" />
      <H1>¿Qué necesitas?</H1>
      <OptionGrid options={NECESIDADES} value={necesidad} onChange={(v) => (necesidad = v)} tone="rojo" />
      <Field label="¿Quiénes están contigo? (puedes elegir varios)" grupo>
        <OptionGrid options={VULNERABLES} value={quienes} onChange={(v) => (quienes = v)} multi tone="rojo" />
      </Field>
      <div class="flex items-center justify-between">
        <span class="text-sm font-extrabold text-gris">¿Cuántas personas?</span>
        <Stepper value={cuantas} onChange={(v) => (cuantas = v)} />
      </div>
      <Field label="Algo más que debamos saber (opcional)">
        <TextArea bind:value={texto} maxlength={160} placeholder="Ej: Mi mamá usa silla de ruedas, estamos en el segundo piso." />
      </Field>
      <PhotoPicker value={foto} onChange={(v) => (foto = v)} />
      <div class="text-sm font-semibold text-gris">📍 Zona aproximada: Mz. {app.user.manzana}. La ubicación exacta solo la ven los Guardianes.</div>
      <Btn variant="rojo" disabled={!necesidad} onclick={pedir}>Pedir ayuda</Btn>
    </Screen>
  </div>
{/if}
