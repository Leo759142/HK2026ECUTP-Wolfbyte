<!-- 6.5 Idioma, letra grande y zona -->
<script>
  import { app } from '../../estado.svelte.js';
  import { IDIOMAS } from '../../i18n.js';
  import { actualizarPerfil } from '../../acciones.js';
  import Btn from '../../ui/Btn.svelte';
  import H1 from '../../ui/H1.svelte';
  import Header from '../../ui/Header.svelte';
  import Pills from '../../ui/Pills.svelte';
  import Screen from '../../ui/Screen.svelte';
  import Toggle from '../../ui/Toggle.svelte';

  function cambiar(patch) {
    app.setSettings((s) => ({ ...s, ...patch }));
    // Si hay sesión, el idioma y la letra grande también se guardan en la cuenta.
    if (app.user) actualizarPerfil({ ...('lang' in patch ? { lang: patch.lang } : {}), ...('largeText' in patch ? { largeText: patch.largeText } : {}) });
  }
</script>

<Screen>
  <Header title="Ajustes" />
  <H1>Idioma y lectura</H1>
  <div class="text-sm font-extrabold text-gris">Idioma</div>
  <div class="overflow-hidden rounded-[20px] border border-linea bg-white" role="radiogroup">
    {#each IDIOMAS as l (l.id)}
      <button type="button" role="radio" aria-checked={app.settings.lang === l.id} onclick={() => cambiar({ lang: l.id })} class="flex min-h-[56px] w-full items-center border-b border-linea px-4 text-left text-base font-bold last:border-b-0">
        <span class="flex-1">{l.label}</span>
        <span class="h-[22px] w-[22px] rounded-full {app.settings.lang === l.id ? 'border-[6px] border-morado' : 'border-2 border-linea'}"></span>
      </button>
    {/each}
  </div>
  {#if app.settings.lang === 'qu'}<p class="text-xs font-semibold text-gris">Traducción al runasimi en preparación: por ahora se muestran algunos textos.</p>{/if}
  <div class="text-sm font-extrabold text-gris">Lectura</div>
  <div class="rounded-[20px] border border-linea bg-white px-4">
    <Toggle checked={app.settings.largeText} onChange={(v) => cambiar({ largeText: v })} label="🔠 Letra grande" hint="Agranda los textos de toda la app" />
  </div>
  {#if app.user && app.sector}
    <div class="text-sm font-extrabold text-gris">Mi zona · {app.sector.name}</div>
    <Pills options={app.sector.manzanas.map((m) => ({ id: m, label: `Mz. ${m}` }))} value={app.user.manzana} onChange={(m) => actualizarPerfil({ manzana: m })} />
  {/if}
  <div class="flex-1"></div>
  <Btn variant="borde" onclick={() => app.go('apiDocs')}>🛠️ Docs API (dev)</Btn>
  <Btn onclick={app.back}>Listo</Btn>
</Screen>
