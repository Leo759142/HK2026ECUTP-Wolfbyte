<!-- Arranque de AYNI (antes main.jsx + efectos de AppContext). -->
<script>
  import { onMount } from 'svelte';
  import App from '../lib/App.svelte';
  import { app } from '../lib/estado.svelte.js';
  import { locale } from '$lib/i18n';
  import { cargarEstadoServidor } from '../lib/acciones.js';
  import { alSincronizar, iniciarMotor, sincronizar } from '../lib/sync/motor.js';

  // Letra grande, modo oscuro y accesibilidad del documento.
  $effect(() => {
    document.documentElement.classList.toggle('letra-grande', Boolean(app.settings.largeText));
    document.documentElement.classList.toggle('modo-oscuro', Boolean(app.settings.modoOscuro));
    document.documentElement.classList.toggle('reducir-movimiento', Boolean(app.settings.reducirMovimiento));
    document.documentElement.lang = $locale;
  });

  onMount(() => {
    cargarEstadoServidor();
    const detener = iniciarMotor();
    const quitar = alSincronizar((ev) => {
      // La sesión del servidor venció: se pide volver a entrar. Lo pendiente de la cola NO se borra.
      if (ev.tipo === 'sesion-vencida' && app.user) {
        app.endSession();
        app.notify('Tu sesión venció. Vuelve a ingresar con tu celular.');
      }
      if (ev.tipo === 'resultado') {
        if (ev.rechazadas?.length) app.notify(`⚠️ ${ev.rechazadas[0].mensaje ?? 'Un cambio no se pudo enviar.'}`);
        else if (ev.enviadas && !app.toast) app.notify(`✅ Se enviaron ${ev.enviadas} cambio(s)`);
      }
    });
    if (app.session?.userId) sincronizar();
    app.validateSession();
    // PWA: abre sin conexión (solo en la versión compilada).
    if (import.meta.env.PROD && 'serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');
    return () => {
      detener();
      quitar();
    };
  });
</script>

<App />
