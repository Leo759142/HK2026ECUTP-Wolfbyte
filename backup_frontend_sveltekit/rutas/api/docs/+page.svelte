<script lang="ts">
	let { data } = $props();
	const specUrl = '/api/openapi.yaml'; // served from static/api/openapi.yaml by SvelteKit
</script>

<svelte:head>
	<title>API Docs | Swagger</title>
	<link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
	<script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
</svelte:head>

<main class="mx-auto max-w-7xl p-4">
	<h1 class="mb-2 text-2xl font-bold">API OpenAPI / Swagger</h1>
	<p class="mb-4 text-sm text-stone-600">Contrato alineado a RF/RNF y schema SQLite. Spec: <a class="underline" href={specUrl}>{specUrl}</a></p>
	<div id="swagger-ui"></div>
	{@html `<script>(function init(){if(window.SwaggerUIBundle){window.SwaggerUIBundle({url:'/api/openapi.yaml',dom_id:'#swagger-ui',presets:[window.SwaggerUIBundle.presets.apis]});}else{setTimeout(init,50);}})();</script>`}
</main>
