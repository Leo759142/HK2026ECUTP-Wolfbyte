<!-- 2.5 Mi perfil -->
<script>
  import { app, datos } from '../../estado.svelte.js';
  import { DIAS_PARA_GUARDIAN } from '../../data.js';
  import { balanceAyni, diasEnAyni, inicial, nombreVisible, progresoGuardian } from '../../util.js';
  import { cerrarSesion, demoAntiguedad, demoGuardian, demoReiniciar } from '../../acciones.js';
  import Avatar from '../../ui/Avatar.svelte';
  import Btn from '../../ui/Btn.svelte';
  import Chip from '../../ui/Chip.svelte';
  import Icon from '../../ui/Icon.svelte';
  import LangChip from '../../ui/LangChip.svelte';
  import Screen from '../../ui/Screen.svelte';
  import Toggle from '../../ui/Toggle.svelte';

  const user = $derived(app.user);
  const balance = $derived(balanceAyni(user.id, datos.favors));
  const publicaciones = $derived(datos.favors.filter((f) => f.ownerId === user.id && f.status !== 'cerrado').length + datos.services.filter((s) => s.ownerId === user.id).length);
  const progreso = $derived(progresoGuardian(user));
  const dias = $derived(diasEnAyni(user));
  const fila = 'flex min-h-[56px] w-full items-center gap-3 border-b border-linea px-4 text-left last:border-b-0';

  async function verComoGuardian(on) {
    if (await demoGuardian(on)) app.notify(on ? '🛡️ Ahora ves AYNI como Guardián' : 'Volviste a ser vecino(a)');
  }
  async function simularMeses() {
    if (await demoAntiguedad()) app.notify('Simulado: llevas 2 meses en AYNI');
  }
  async function reiniciar() {
    if (window.confirm('¿Borrar todos los datos y volver a los de ejemplo?')) await demoReiniciar();
  }
</script>

<div class="flex flex-1 flex-col">
  <div class="relative flex flex-col items-center gap-2 rounded-b-[28px] bg-petroleo px-5 pb-6 pt-4 text-center text-white">
    <LangChip class="absolute right-4 top-3" />
    <Avatar letter={inicial(user)} class="h-20 w-20 border-[3px] border-white bg-ambar text-3xl" />
    <h1 class="text-2xl font-black">{user.firstName} {user.lastName}</h1>
    <p class="text-sm font-semibold opacity-90">Tus vecinos te ven como “{nombreVisible(user)}” · {app.sector?.name} · Mz. {user.manzana}</p>
    <div class="flex flex-wrap justify-center gap-2">
      <Chip class="bg-white text-petroleo-osc">✅ Vecino(a) verificado(a)</Chip>
      {#if app.isGuardian}<Chip class="bg-morado text-white">🛡️ Guardián</Chip>{/if}
    </div>
  </div>

  <Screen class="gap-3">
    <div class="rounded-[20px] border-2 border-morado bg-white p-4">
      <div class="text-base font-black text-morado-osc">🤝 Tu Balance de Ayni</div>
      <div class="mt-2 grid grid-cols-2 gap-2.5 text-center">
        <div class="rounded-2xl bg-morado-claro p-2 text-morado-osc"><div class="text-2xl font-black">{balance.dados}</div><div class="text-xs font-extrabold">favores dados</div></div>
        <div class="rounded-2xl bg-morado-claro p-2 text-morado-osc"><div class="text-2xl font-black">{balance.recibidos}</div><div class="text-xs font-extrabold">favores recibidos</div></div>
      </div>
    </div>

    {#if !app.isGuardian}
      <div class="flex flex-col gap-2 rounded-[20px] border border-linea bg-white p-4">
        <div class="flex justify-between text-base font-black">
          <span>🛡️ Camino a Guardián</span>
          <span class="text-sm text-gris">{Math.round(progreso * 100)}%</span>
        </div>
        <div class="h-2 overflow-hidden rounded-full bg-linea"><div class="h-full rounded-full bg-morado" style="width: {progreso * 100}%"></div></div>
        <div class="text-sm font-semibold text-gris">
          {dias >= DIAS_PARA_GUARDIAN ? 'Ya cumples los 2 meses. ¡Puedes ser Guardián!' : `Llevas ${dias} días en AYNI. Te invitaremos al cumplir 2 meses.`}
        </div>
        {#if dias >= DIAS_PARA_GUARDIAN}<Btn variant="acento" onclick={() => app.go('invitacionGuardian')}>Quiero ser Guardián</Btn>{/if}
      </div>
    {/if}

    <div class="grid grid-cols-2 gap-2.5 text-center">
      <div class="rounded-2xl border border-linea bg-white p-2"><div class="text-xl font-black">{publicaciones}</div><div class="text-xs font-bold text-gris">publicaciones</div></div>
      <div class="rounded-2xl border border-linea bg-white p-2"><div class="text-xl font-black">{datos.recommendations.filter((r) => r.userId === user.id).length}</div><div class="text-xs font-bold text-gris">vistos buenos dados</div></div>
    </div>

    <nav class="overflow-hidden rounded-[20px] border border-linea bg-white" aria-label="Menú">
      <button type="button" class={fila} onclick={() => app.go('misPublicaciones')}><Icon name="fa-clipboard-list" /> <span class="flex-1 font-bold">Mis publicaciones</span>›</button>
      {#if app.isGuardian}<button type="button" class={fila} onclick={() => app.go('panelGuardian')}><Icon name="fa-shield-halved" /> <span class="flex-1 font-bold">Panel del Guardián</span>›</button>{/if}
      <button type="button" class={fila} onclick={() => app.go('ajustes')}><span aria-hidden="true">⚙️</span><span class="flex-1 font-bold">Idioma, letra grande y zona</span>›</button>
      <button type="button" class={fila} onclick={() => app.go('tutorial', { desdePerfil: true })}><span aria-hidden="true">📖</span><span class="flex-1 font-bold">Ver tutorial otra vez</span>›</button>
      <button type="button" class={fila} onclick={cerrarSesion}><span aria-hidden="true">🚪</span><span class="flex-1 font-bold text-gris">Cerrar sesión</span>›</button>
    </nav>

    {#if app.servidor.demo}
      <details class="rounded-[20px] border border-dashed border-gris bg-white p-4">
        <summary class="min-h-[32px] cursor-pointer text-sm font-extrabold text-gris">🧪 Herramientas de demostración (para el jurado)</summary>
        <div class="mt-2 flex flex-col">
          <Toggle checked={app.settings.forceOffline} onChange={(v) => app.setSettings((s) => ({ ...s, forceOffline: v }))} label="Simular sin conexión" hint="Lo que publiques quedará “pendiente de enviar”" />
          <Toggle checked={app.isGuardian} onChange={verComoGuardian} label="Ver AYNI como Guardián" hint="Para confirmar emergencias y moderar desde este celular" />
          <button type="button" class="min-h-[52px] text-left text-base font-bold" onclick={simularMeses}>⏩ Simular 2 meses en AYNI</button>
          <button type="button" class="min-h-[52px] text-left text-base font-bold text-gris" onclick={reiniciar}>♻️ Reiniciar datos de demostración</button>
        </div>
      </details>
    {/if}
  </Screen>
</div>
