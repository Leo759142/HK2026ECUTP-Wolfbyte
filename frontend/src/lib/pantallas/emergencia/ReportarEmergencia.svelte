<!-- 4.1 Reportar emergencia -->
<script>
  import { app } from '../../estado.svelte.js';
  import { TIPOS_EMERGENCIA } from '../../data.js';
  import { reportarEmergencia } from '../../acciones.js';
  import Btn from '../../ui/Btn.svelte';
  import Field from '../../ui/Field.svelte';
  import H1 from '../../ui/H1.svelte';
  import Header from '../../ui/Header.svelte';
  import OptionGrid from '../../ui/OptionGrid.svelte';
  import PhotoPicker from '../../ui/PhotoPicker.svelte';
  import Screen from '../../ui/Screen.svelte';
  import TextArea from '../../ui/TextArea.svelte';

  let tipo = $state('');
  let texto = $state('');
  let foto = $state(null);
  function enviar() {
    const e = reportarEmergencia({ tipo, texto: texto.trim(), foto });
    app.replace('reporteEnviado', { id: e.id });
  }
</script>

<Screen class="gap-3">
  <Header title="Lo verá un Guardián" />
  <H1>¿Qué está pasando?</H1>
  <OptionGrid options={TIPOS_EMERGENCIA} value={tipo} onChange={(v) => (tipo = v)} tone="rojo" />
  <Field label="Cuéntanos más (opcional)">
    <TextArea bind:value={texto} maxlength={200} placeholder="Ej: Se desbordó la acequia y el agua entra a las casas…" />
  </Field>
  <PhotoPicker value={foto} onChange={(v) => (foto = v)} />
  <div class="text-sm font-semibold text-gris">📍 Ubicación automática: Mz. {app.user.manzana}</div>
  {#if app.isGuardian}<div class="rounded-2xl bg-morado-claro p-3 text-sm font-bold text-morado-osc">🛡️ Como Guardián podrás confirmarlo tú mismo desde tu panel.</div>{/if}
  <div class="flex-1"></div>
  <Btn variant="rojo" disabled={!tipo} onclick={enviar}>Enviar reporte</Btn>
</Screen>
