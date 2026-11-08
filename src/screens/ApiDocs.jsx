import { useEffect } from 'react';
import { Screen, Header, Btn } from '../componentes/ui';

export function ApiDocs() {
  useEffect(() => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui.css';
    document.head.appendChild(css);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js';
    script.onload = () => {
      window.SwaggerUIBundle({ url: '/api/openapi.yaml', dom_id: '#swagger-ui', presets: [window.SwaggerUIBundle.presets.apis] });
    };
    document.body.appendChild(script);
    return () => { css.remove(); script.remove(); };
  }, []);
  return (
    <Screen>
      <Header title="API Docs" />
      <div id="swagger-ui" />
    </Screen>
  );
}
