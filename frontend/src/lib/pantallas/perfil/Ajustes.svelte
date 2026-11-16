<!-- 6.5 Idioma, letra grande y zona -->
<script>
  import { app } from '../../estado.svelte.js';
  import { locale, setLocale } from '$lib/i18n';
  import { IDIOMAS, obtenerIdioma } from '$lib/i18n/languages.js';
  import { browser } from '$app/environment';
  import { actualizarPerfil } from '../../acciones.js';
  import Btn from '../../ui/Btn.svelte';
  import H1 from '../../ui/H1.svelte';
  import Header from '../../ui/Header.svelte';
  import Pills from '../../ui/Pills.svelte';
  import Screen from '../../ui/Screen.svelte';
  import Toggle from '../../ui/Toggle.svelte';

  function cambiar(patch) {
    app.setSettings((s) => ({ ...s, ...patch }));
    if ('lang' in patch && browser) {
      setLocale(patch.lang);
      // Una sola fuente de verdad: escribimos ambas claves atómicamente para evitar desincronía.
      localStorage.setItem('idioma', patch.lang);
      localStorage.setItem('ayni_settings', JSON.stringify({ ...app.settings, ...patch }));
    }
    // Si hay sesión, el idioma y la letra grande también se guardan en la cuenta.
    if (app.user) actualizarPerfil({ ...('lang' in patch ? { lang: patch.lang } : {}), ...('largeText' in patch ? { largeText: patch.largeText } : {}) });
  }

  /** Metadatos del idioma activo para mostrar aviso de borrador si aplica. */
  const idiomaActivo = obtenerIdioma($locale);
</script>

<Screen>
  <Header title="Ajustes" />
  <H1>Idioma y lectura</H1>
  <div class="text-sm font-extrabold text-gris">Idioma</div>
  <div class="overflow-hidden rounded-[20px] border border-linea bg-white" role="radiogroup">
    {#each IDIOMAS as l (l.id)}
      <button type="button" role="radio" aria-checked={app.settings.lang === l.id} onclick={() => cambiar({ lang: l.id })} class="flex min-h-[56px] w-full items-center border-b border-linea px-4 text-left text-base font-bold last:border-b-0">
        <span class="flex-1">{l.label}</span>
        <span class="h-[22px] w-[22px] rounded-full {$locale === l.id ? 'border-[6px] border-morado' : 'border-2 border-linea'}"></span>
      </button>
    {/each}
  </div>
  {#if idiomaActivo.draft}<p class="text-xs font-semibold text-gris">Traducción al {idiomaActivo.labelNativo} en preparación: por ahora se muestran algunos textos.</p>{/if}
  <div class="text-sm font-extrabold text-gris">Lectura</div>
  <div class="rounded-[20px] border border-linea bg-white px-4">
    <Toggle checked={app.settings.largeText} onChange={(v) => cambiar({ largeText: v })} label="🔠 Letra grande" hint="Agranda los textos de toda la app" />
  </div>
  <div class="text-sm font-extrabold text-gris">Apariencia</div>
  <div class="rounded-[20px] border border-linea bg-white px-4">
    <Toggle checked={app.settings.modoOscuro} onChange={(v) => cambiar({ modoOscuro: v })} label="🌙 Modo oscuro" hint="Interfaz con fondo oscuro" />
  </div>
  <div class="text-sm font-extrabold text-gris">Accesibilidad</div>
  <div class="rounded-[20px] border border-linea bg-white px-4">
    <Toggle checked={app.settings.reducirMovimiento} onChange={(v) => cambiar({ reducirMovimiento: v })} label="↓ Reducir movimiento" hint="Reducir animaciones y scroll automático" />
  </div>
  {#if app.user && app.sector}
    <div class="text-sm font-extrabold text-gris">Mi zona · {app.sector.name}</div>
    <Pills options={app.sector.manzanas.map((m) => ({ id: m, label: `Mz. ${m}` }))} value={app.user.manzana} onChange={(m) => actualizarPerfil({ manzana: m })} />
  {/if}
  <div class="flex-1"></div>
  <Btn variant="borde" onclick={() => app.go('apiDocs')}>🛠️ Docs API (dev)</Btn>
  <Btn onclick={app.back}>Listo</Btn>
</Screen>
