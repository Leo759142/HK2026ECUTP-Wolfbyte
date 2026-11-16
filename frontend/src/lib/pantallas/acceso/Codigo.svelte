<!-- 0.3 / 1.5 Código SMS: lo verifica el servidor. Si el número ya tiene cuenta entra; si no, sigue el registro. -->
<script>
  import { app } from '../../estado.svelte.js';
  import { load } from '../../storage.js';
  import { entrar, verificarCodigo } from '../../acciones.js';
  import Btn from '../../ui/Btn.svelte';
  import H1 from '../../ui/H1.svelte';
  import Header from '../../ui/Header.svelte';
  import Input from '../../ui/Input.svelte';
  import LinkBtn from '../../ui/LinkBtn.svelte';
  import Screen from '../../ui/Screen.svelte';
  import Sub from '../../ui/Sub.svelte';
  import Progreso from './Progreso.svelte';

  let { mode = 'registro' } = $props();
  const DRAFT = load('registro', {});
  // Números y códigos de demo hardcodeados (sin backend)
  const PHONE_DEMO = '900000001';
  const CODE_DEMO = '1234';
  let code = $state('');
  let error = $state('');
  let verificando = $state(false);

  async function verificar() {
    // Modo demostración: verificar con código hardcodeado sin llamar al backend
    if (DRAFT.codigoDemo && code === CODE_DEMO) {
      verificando = true;
      try {
        if (mode === 'registro') app.notify('✅ Código correcto. Bienvenido a AYNI.');
        await entrar({ id: 'demo_user', nombre: 'Demo User', telefono: PHONE_DEMO });
        return;
      } catch (e) {
        error = e.message;
      } finally {
        verificando = false;
      }
    }
    // Modo normal: llamar al backend
    verificando = true;
    try {
      const r = await verificarCodigo(draft.phone, code);
      if (r.tipo === 'sesion') {
        if (mode === 'registro') app.notify('Ese número ya tenía cuenta: entraste a AYNI.');
        await entrar(r.usuario);
        return;
      }
      if (mode === 'login') app.notify('Aún no tienes cuenta con ese número: completa tu registro.');
      app.go('nombre');
    } catch (e) {
      error = e.message;
    } finally {
      verificando = false;
    }
  }
</script>

<Screen>
  <Header title={mode === 'registro' ? 'Paso 2 de 4' : 'Ingresar'} />
  {#if mode === 'registro'}<Progreso paso={2} total={5} />{/if}
  <H1>Escribe el código</H1>
  <Sub>Lo enviamos por SMS al +51 {draft.phone}</Sub>
  <Input
    inputmode="numeric"
    autocomplete="one-time-code"
    aria-label="Código de 4 dígitos"
    maxlength={4}
    placeholder="• • • •"
    class="min-h-[64px] text-center text-3xl font-black tracking-[0.6em]"
    value={code}
    oninput={(e) => {
      error = '';
      code = e.currentTarget.value.replace(/\D/g, '');
      e.currentTarget.value = code;
    }} />
  {#if error}<p class="text-sm font-bold text-morado-osc">{error}</p>{/if}
  {#if draft.codigoDemo}
    <div class="rounded-2xl bg-ambar-claro px-4 py-3 text-sm font-bold">🧪 Modo demostración: el código es {draft.codigoDemo}. En producción llegaría por SMS.</div>
  {/if}
  <LinkBtn onclick={app.back}>Cambiar número</LinkBtn>
  <div class="flex-1"></div>
  <Btn disabled={code.length !== 4 || verificando} onclick={verificar}>{mode === 'login' ? 'Entrar' : 'Verificar'}</Btn>
</Screen>
