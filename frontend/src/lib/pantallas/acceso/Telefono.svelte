<!-- 0.2 / 1.4 Número de celular: pide el código SMS al servidor (no revela si el número ya tiene cuenta). -->
<script>
  import { app } from '../../estado.svelte.js';
  import { load, save } from '../../storage.js';
  import { solicitarCodigo, MODO_DEMO } from '../../acciones.js';
  import Btn from '../../ui/Btn.svelte';
  import H1 from '../../ui/H1.svelte';
  import Header from '../../ui/Header.svelte';
  import Input from '../../ui/Input.svelte';
  import Screen from '../../ui/Screen.svelte';
  import Sub from '../../ui/Sub.svelte';
  import Progreso from './Progreso.svelte';

  let { mode = 'registro' } = $props();
  const DRAFT = load('registro', {});
  let phone = $state(DRAFT.phone ?? '');
  let error = $state('');
  let enviando = $state(false);
  const valido = $derived(/^9\d{8}$/.test(phone));
  const esDemo = $derived(phone === MODO_DEMO.PHONE);

  async function continuar() {
    enviando = true;
    try {
      if (esDemo) {
        // Modo demostración: simular recibir código SMS sin llamar al backend
        save('registro', { ...DRAFT, phone: MODO_DEMO.PHONE, codigoDemo: MODO_DEMO.CODE });
        app.go('codigo', { mode });
        app.notify('🧪 Modo demostración: código 1234 enviado al número 900000001');
      } else {
        // Modo real: pedir código al servidor
        await solicitarCodigo(phone);
        save('registro', { ...DRAFT, phone, codigoDemo: null });
        app.go('codigo', { mode });
        app.notify(`Código enviado por SMS al +51 ${phone}`);
      }
    } catch (e) {
      error = e.message;
    } finally {
      enviando = false;
    }
  }
</script>

<Screen>
  <Header title={mode === 'registro' ? 'Paso 1 de 4' : 'Ingresar'} />
  {#if mode === 'registro'}<Progreso paso={1} total={5} />{/if}
  <H1>{mode === 'registro' ? '¿Cuál es tu número de celular?' : '¡Hola de nuevo! 👋'}</H1>
  <Sub>{mode === 'registro' ? 'Te enviaremos un código por SMS para verificar que eres tú.' : 'Escribe tu número y te enviaremos un código para entrar. No necesitas contraseña.'}</Sub>
  <div class="flex gap-2.5">
    <div class="flex min-h-[56px] w-24 items-center justify-center rounded-2xl border-2 border-linea bg-white font-bold">🇵🇪 +51</div>
    <Input
      type="tel"
      inputmode="numeric"
      autocomplete="tel-national"
      aria-label="Número de celular"
      placeholder="987 654 321"
      maxlength={9}
      class="min-h-[56px] flex-1 text-lg"
      value={phone}
      oninput={(e) => {
        error = '';
        phone = e.currentTarget.value.replace(/\D/g, '');
        e.currentTarget.value = phone;
      }} />
  </div>
  {#if error}<p class="text-sm font-bold text-morado-osc">{error}</p>{/if}
  <p class="text-sm font-semibold text-gris">🔒 Tus vecinos no verán tu número. Solo se usa para WhatsApp cuando tú lo decidas.</p>
  <div class="flex-1"></div>
  <Btn disabled={!valido || enviando} onclick={continuar}>{enviando ? 'Enviando…' : 'Enviar código'}</Btn>
</Screen>
