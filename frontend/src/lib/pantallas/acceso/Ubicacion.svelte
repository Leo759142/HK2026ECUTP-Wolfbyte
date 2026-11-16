<!-- 1.7 Ubicación: geolocalización dual (GPS/IP/manual), guarda zona aproximada (~100 m). -->
<script>
  import { onMount } from 'svelte';
  import { app } from '../../estado.svelte.js';
  import { load, save } from '../../storage.js';
  import { GeoLocationService, approxFromLocation } from '../../servicios/geoService';
  import Btn from '../../ui/Btn.svelte';
  import Circle from '../../ui/Circle.svelte';
  import Field from '../../ui/Field.svelte';
  import GeoConsentModal from '../../ui/GeoConsentModal.svelte';
  import H1 from '../../ui/H1.svelte';
  import Header from '../../ui/Header.svelte';
  import LinkBtn from '../../ui/LinkBtn.svelte';
  import Screen from '../../ui/Screen.svelte';
  import Sub from '../../ui/Sub.svelte';
  import TextArea from '../../ui/TextArea.svelte';
  import Progreso from './Progreso.svelte';

  let modalAbierto = $state(false);
  let manual = $state(false);
  let address = $state(load('registro', {}).address ?? '');
  let cached = $state(null);

  onMount(() => {
    cached = GeoLocationService.getCachedLocation();
  });

  function aplicarUbicacion(loc) {
    const approx = approxFromLocation(loc);
    const registro = { ...load('registro', {}), ...(approx || {}), geo: loc, geo_provider: loc?.provider ?? null };
    if (loc?.city || loc?.country) registro.geo_label = [loc.city, loc.country].filter(Boolean).join(', ');
    save('registro', registro);
    GeoLocationService.setCachedLocation(loc);

    // Persist real coordinates to user profile (backend will use these)
    const usuario = load('usuario', null);
    if (loc?.coords) {
      const usuarioActualizado = usuario ? {
        ...usuario,
        lat_aprox: loc.coords.lat,
        lng_aprox: loc.coords.lng,
        geo_provider: loc.provider,
        geo_lastUpdate: Date.now(),
      } : null;
      save('usuario', usuarioActualizado);
      // Sync to backend when online
      if (app.online && usuario?.id) {
        (async () => {
          try {
            await post('/api/v1/usuarios', {
              id: usuario.id,
              coords_nuevas: { lat: loc.coords.lat, lng: loc.coords.lng },
              provider: loc.provider,
            });
            app.notify('Coordenadas guardadas en tu perfil');
          } catch (e) {
            console.warn('No se pudo sincronizar coordenadas:', e);
          }
        })();
      }
    }
    app.go('zona');
  }

  function usarGuardada() {
    if (!cached) return;
    aplicarUbicacion(cached);
  }

  function abrirModal() {
    modalAbierto = true;
  }

  function guardarDireccion() {
    const texto = address.trim();
    save('registro', { ...load('registro', {}), address: texto });
    app.go('zona');
  }
</script>

<Screen>
  <Header title="Paso 4 de 4" />
  <Progreso paso={4} total={5} />
  <Circle emoji="📍" class="bg-petroleo-claro" />
  <H1>Activa tu ubicación</H1>
  <Sub>La usamos para mostrarte lo que hay cerca y ubicar tu sector. Guardamos solo una zona aproximada, nunca tu dirección exacta.</Sub>
  <ul class="flex flex-col gap-2 text-[15px] font-bold">
    <li>✅ Solo usamos tu zona aproximada (~100 m)</li>
    <li>✅ Puedes usar GPS, IP o elegir ciudad manualmente</li>
    <li>✅ Puedes cambiarla cuando quieras</li>
  </ul>

  {#if cached}
    <div class="rounded-2xl border-2 border-linea bg-white p-3 text-sm font-semibold">
      <div class="font-black text-petroleo-osc">Última ubicación guardada</div>
      <div>{cached.city || 'Zona aproximada'}{cached.country ? `, ${cached.country}` : ''} · {cached.provider === 'gps' ? 'GPS' : cached.provider === 'ip' ? 'IP' : 'Manual'}</div>
    </div>
  {/if}

  {#if manual}
    <Field label="Tu dirección o una referencia" hint="Solo la verán los Guardianes durante una emergencia.">
      <TextArea bind:value={address} placeholder="Ej: Calle Los Pinos 123, frente al parque" />
    </Field>
  {/if}

  <div class="flex-1"></div>

  {#if manual}
    <Btn disabled={address.trim().length < 5} onclick={guardarDireccion}>Continuar</Btn>
    <LinkBtn onclick={() => (manual = false)}>Volver a opciones de ubicación</LinkBtn>
  {:else}
    {#if cached}
      <Btn variant="borde" onclick={usarGuardada}>Usar mi última ubicación</Btn>
    {/if}
    <Btn onclick={abrirModal}>📍 Elegir cómo ubicar mi zona</Btn>
    <LinkBtn onclick={() => (manual = true)}>Prefiero escribir mi dirección</LinkBtn>
  {/if}
</Screen>

<GeoConsentModal
  open={modalAbierto}
  onClose={() => (modalAbierto = false)}
  onLocationResolved={aplicarUbicacion}
/>
