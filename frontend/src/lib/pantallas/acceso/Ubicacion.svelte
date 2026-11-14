<!-- 1.7 Ubicación (se guarda redondeada ~100 m: nunca la ubicación exacta) -->
<script>
  import { app } from '../../estado.svelte.js';
  import { load, save } from '../../storage.js';
  import Btn from '../../ui/Btn.svelte';
  import Circle from '../../ui/Circle.svelte';
  import Field from '../../ui/Field.svelte';
  import H1 from '../../ui/H1.svelte';
  import Header from '../../ui/Header.svelte';
  import LinkBtn from '../../ui/LinkBtn.svelte';
  import Screen from '../../ui/Screen.svelte';
  import Sub from '../../ui/Sub.svelte';
  import TextArea from '../../ui/TextArea.svelte';
  import Progreso from './Progreso.svelte';

  let manual = $state(false);
  let address = $state(load('registro', {}).address ?? '');
  let buscando = $state(false);

  function permitir() {
    if (!navigator.geolocation) return (manual = true);
    buscando = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const location = { lat: Number(pos.coords.latitude.toFixed(3)), lng: Number(pos.coords.longitude.toFixed(3)) };
        save('registro', { ...load('registro', {}), location });
        buscando = false;
        app.go('zona');
      },
      () => {
        buscando = false;
        app.notify('No pudimos obtener tu ubicación. Elige tu zona en la lista.');
        app.go('zona');
      },
      { timeout: 8000 }
    );
  }
</script>

<Screen>
  <Header title="Paso 4 de 4" />
  <Progreso paso={4} />
  <Circle emoji="📍" class="bg-petroleo-claro" />
  <H1>Activa tu ubicación</H1>
  <Sub>La usamos para mostrarte lo que hay cerca y confirmar que vives en el barrio.</Sub>
  <ul class="flex flex-col gap-2 text-[15px] font-bold">
    <li>✅ Solo usamos tu zona, nunca tu dirección exacta</li>
    <li>✅ Puedes cambiarla cuando quieras</li>
    <li>✅ En una emergencia ayuda a que te encuentren</li>
  </ul>
  {#if manual}
    <Field label="Tu dirección o una referencia" hint="Solo la verán los Guardianes durante una emergencia.">
      <TextArea bind:value={address} placeholder="Ej: Calle Los Pinos 123, frente al parque" />
    </Field>
  {/if}
  <div class="flex-1"></div>
  {#if manual}
    <Btn
      disabled={address.trim().length < 5}
      onclick={() => {
        save('registro', { ...load('registro', {}), address: address.trim() });
        app.go('zona');
      }}>Continuar</Btn>
  {:else}
    <Btn onclick={permitir} disabled={buscando}>{buscando ? 'Buscando tu zona…' : '📍 Permitir ubicación'}</Btn>
    <LinkBtn onclick={() => (manual = true)}>Prefiero escribir mi dirección</LinkBtn>
  {/if}
</Screen>
