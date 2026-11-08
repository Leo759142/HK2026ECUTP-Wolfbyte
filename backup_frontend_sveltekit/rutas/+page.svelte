<svelte:head><title>Inicio | ProyectoOneDrive</title></svelte:head>
<section class="space-y-4">
	<h1 class="text-2xl font-bold">Solidaridad barrial, oficios y ayuda</h1>
	<p class="max-w-3xl text-stone-700">MVP offline-first alineado a RF/RNF: servicios de proximidad, cadena de favores, modo emergencia, anuncios etiquetados, sync con cola/idempotencia y privacidad por ubicación aproximada.</p>
	<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
		<a class="rounded-xl border bg-white p-4 shadow-sm" href="/servicios"><h2 class="font-semibold">Servicios cercanos</h2><p class="text-sm">Buscar oficios con Visto Bueno (RF05-RF08).</p></a>
		<a class="rounded-xl border bg-white p-4 shadow-sm" href="/favores"><h2 class="font-semibold">Cadena de favores</h2><p class="text-sm">Pedir/ayudar y cerrar con “Se cumplió” (RF09-RF11).</p></a>
		<a class="rounded-xl border bg-white p-4 shadow-sm" href="/emergencia"><h2 class="font-semibold">Emergencia</h2><p class="text-sm">Alertas, recursos críticos y directorio (RF12-RF15).</p></a>
		<a class="rounded-xl border bg-white p-4 shadow-sm" href="/mapa"><h2 class="font-semibold">Mapa aproximado</h2><p class="text-sm">Ubicación por zona/manzana, sin dirección exacta (RF19/RNF).</p></a>
		<a class="rounded-xl border bg-white p-4 shadow-sm" href="/publicar"><h2 class="font-semibold">Publicar en 3 pasos</h2><p class="text-sm">Flujo rápido con estado offline (RF17/RF18/RF25).</p></a>
		<a class="rounded-xl border bg-white p-4 shadow-sm" href="/api/docs"><h2 class="font-semibold">Swagger / OpenAPI</h2><p class="text-sm">Contrato API v1 para integración y pruebas.</p></a>
	</div>
	<div role="status" aria-live="polite" class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">Acciones sin conexión se guardan como <strong>Pendiente de enviar</strong> y se sincronizan al volver la señal.</div>
</section>
