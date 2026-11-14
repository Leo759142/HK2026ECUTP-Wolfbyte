<!-- Documentación de la API (Swagger UI con el contrato del backend). Herramienta de desarrollo: necesita internet. -->
<script>
  import { onMount } from 'svelte';
  import Header from '../ui/Header.svelte';
  import Screen from '../ui/Screen.svelte';

  const VERSION = '5.17.14';
  onMount(() => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = `https://unpkg.com/swagger-ui-dist@${VERSION}/swagger-ui.css`;
    document.head.appendChild(css);
    const script = document.createElement('script');
    script.src = `https://unpkg.com/swagger-ui-dist@${VERSION}/swagger-ui-bundle.js`;
    script.onload = () => window.SwaggerUIBundle({ url: '/api/openapi.yaml', dom_id: '#swagger-ui', presets: [window.SwaggerUIBundle.presets.apis] });
    document.body.appendChild(script);
    return () => {
      css.remove();
      script.remove();
    };
  });
</script>

<Screen>
  <Header title="API Docs" />
  <div id="swagger-ui"></div>
</Screen>
