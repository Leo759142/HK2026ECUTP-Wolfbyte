<!-- 4.1 Reportar emergencia -->
<script>
  import { onMount } from 'svelte';
  import { app } from '../../estado.svelte.js';
  import { TIPOS_EMERGENCIA } from '../../data.js';
  import { reportarEmergencia } from '../../acciones.js';
  import { GeoLocationService, approxFromLocation } from '../../servicios/geoService';
  import ProvinciaSelectorModal from './ProvinciaSelectorModal.svelte';
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
  let selectorAbierto = $state(false);
  let ubicacion = $state({ provinciaId: null, distritoId: null, lat_aprox: null, lng_aprox: null, label: '' });

  onMount(() => {
    const loc = GeoLocationService.getCachedLocation();
    const approx = approxFromLocation(loc);
    if (approx) {
      ubicacion.lat_aprox = approx.lat_aprox;
      ubicacion.lng_aprox = approx.lng_aprox;
      ubicacion.label = loc?.city ? `${loc.city}${loc?.country ? `, ${loc.country}` : ''}` : 'Zona aproximada guardada';
    }
  });

  function onUbicacion(sel) {
    ubicacion = {
      provinciaId: sel?.provinciaId ?? null,
      distritoId: sel?.distritoId ?? null,
      lat_aprox: sel?.lat_aprox ?? null,
      lng_aprox: sel?.lng_aprox ?? null,
      label: [sel?.distritoNombre, sel?.provinciaNombre].filter(Boolean).join(', ') || sel?.provinciaNombre || 'Zona aproximada seleccionada',
    };
  }

  function enviar() {
    const e = reportarEmergencia({
      tipo,
      texto: texto.trim(),
      foto,
      provinciaId: ubicacion.provinciaId,
      distritoId: ubicacion.distritoId,
      lat_aprox: ubicacion.lat_aprox,
      lng_aprox: ubicacion.lng_aprox,
    });
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

  <div class="flex flex-col gap-2 rounded-2xl border-2 border-linea bg-white p-3">
    <div class="text-sm font-extrabold">📍 Ubicación aproximada</div>
    <div class="text-sm font-semibold text-gris">Mz. {app.user.manzana}{ubicacion.label ? ` · ${ubicacion.label}` : ''}</div>
    <Btn variant="borde" class="!min-h-[44px] !text-sm" onclick={() => (selectorAbierto = true)}>
      {ubicacion.provinciaId ? 'Cambiar provincia/distrito' : 'Seleccionar provincia/distrito (sin GPS)'}
    </Btn>
    <div class="text-xs font-semibold text-gris">Se guarda solo zona aproximada. Guardianes verán ubicación precisa solo si diste permiso.</div>
  </div>

  {#if app.isGuardian}<div class="rounded-2xl bg-morado-claro p-3 text-sm font-bold text-morado-osc">🛡️ Como Guardián podrás confirmarlo tú mismo desde tu panel.</div>{/if}
  <div class="flex-1"></div>
  <Btn variant="rojo" disabled={!tipo} onclick={enviar}>Enviar reporte</Btn>
</Screen>

<ProvinciaSelectorModal open={selectorAbierto} onClose={() => (selectorAbierto = false)} onSelect={onUbicacion} />
