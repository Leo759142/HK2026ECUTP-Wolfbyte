<script>
  import '@fortawesome/fontawesome-free/css/all.min.css';
  import '../app.css';
  import { setLocale } from '$lib/i18n';
  import { browser } from '$app/environment';
  import { app } from '../lib/estado.svelte.js';
  let { children } = $props();

  if (browser) {
    // Única fuente de verdad: settings.lang (blob ayni_settings). idioma se deriva de ahí.
    const saved = localStorage.getItem('ayni_settings');
    let lang = 'es';
    if (saved) {
      try {
        const cfg = JSON.parse(saved);
        if (cfg && typeof cfg.lang === 'string') lang = cfg.lang;
      } catch { /* ignorar JSON corrupto */ }
    }
    // Fallback a la clave legacy 'idioma' si no hay settings.
    if (lang === 'es') {
      const legacy = localStorage.getItem('idioma');
      if (legacy) lang = legacy;
    }
    setLocale(lang);
  }
</script>

{@render children()}
