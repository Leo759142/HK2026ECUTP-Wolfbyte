<script lang="ts">
	import { onMount } from 'svelte';
	let items = $state<Array<Record<string, any>>>([]);
	onMount(async () => { try { items = (await (await fetch('/api/v1/alertas')).json()).items ?? []; } catch {} });
</script>
<svelte:head><title>Emergencia | ProyectoOneDrive</title></svelte:head>
<h1 class="text-xl font-bold">Modo emergencia y ayuda humanitaria</h1>
<p class="mt-1 text-sm text-stone-600">RF12-RF15, RF22: activar emergencia, reportar necesidad con ubicación aproximada, ver directorio/recursos y pausar anuncios.</p>
<div class="mt-3 flex flex-wrap gap-2">
	<a class="rounded bg-rose-700 px-4 py-3 font-medium text-white" href="/publicar?tipo=alerta">Reportar necesidad</a>
	<a class="rounded border px-4 py-3" href="/mapa">Ver apoyo cercano</a>
</div>
<div class="mt-4 rounded border border-rose-200 bg-rose-50 p-3 text-sm" role="status">Etiquetas de alerta: tipo, estado (sin verificar/confirmado por vecinos/atendido/descartado), fuente y ubicación aproximada.</div>
<ul class="mt-4 grid gap-3">{#if items.length === 0}<li class="rounded border bg-white p-4">Sin alertas activas.</li>{/if}{#each items as a}<li class="rounded-xl border bg-white p-4"><h2 class="font-semibold">{a.tipo}</h2><p class="text-sm">{a.descripcion}</p><p class="mt-1 text-xs">Estado: {a.estado} · Ubicación aproximada</p></li>{/each}</ul>
