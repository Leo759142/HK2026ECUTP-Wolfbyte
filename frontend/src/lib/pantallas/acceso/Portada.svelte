<!-- 0.1 Portada -->
<script>
  import { app } from '../../estado.svelte.js';
  import { t } from '$lib/i18n';
  import { entrar, solicitarCodigo, verificarCodigo } from '../../acciones.js';
  import Btn from '../../ui/Btn.svelte';
  import H1 from '../../ui/H1.svelte';
  import LangChip from '../../ui/LangChip.svelte';
  import LinkBtn from '../../ui/LinkBtn.svelte';
  import Screen from '../../ui/Screen.svelte';
  import Sub from '../../ui/Sub.svelte';

  let entrando = $state(false);

  /** Demo: entra como Rosa (celular 900000001) pasando por el mismo OTP del servidor. */
  async function entrarComoRosa() {
    entrando = true;
    try {
      const envio = await solicitarCodigo('900000001');
      const r = await verificarCodigo('900000001', envio.codigo_demo);
      if (r.tipo === 'sesion') await entrar(r.usuario);
    } catch (e) {
      app.notify(e.message);
    } finally {
      entrando = false;
    }
  }
</script>

<Screen class="items-center pb-9 text-center">
  <div class="self-end"><LangChip /></div>
  <div class="flex flex-1 flex-col items-center justify-center gap-4">
    <img src="/logo.jpg" alt="AYNI" class="w-64 rounded-3xl" />
    <H1>{$t('lema')}</H1>
    <Sub>{$t('serviciosDescritos')}</Sub>
  </div>
  <Btn onclick={() => app.go('tutorial')}>{$t('crearCuenta')}</Btn>
  <Btn variant="borde" onclick={() => app.go('telefono', { mode: 'login' })}>{$t('yaTengo')}</Btn>
  <LinkBtn onclick={entrarComoRosa} disabled={entrando}>{entrando ? 'Entrando…' : 'Entrar como vecina de prueba (Rosa)'}</LinkBtn>
</Screen>
