<script lang="ts">
	import { onMount } from 'svelte';
	let items = $state<Array<Record<string, any>>>([]);
	onMount(async () => { try { items = (await (await fetch('/api/v1/favores')).json()).items ?? []; } catch {} });
	async function cerrarDemo(id: string) {
		await fetch(`/api/v1/favores/${id}/confirmaciones`, { method: 'POST', headers: { 'content-type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ rol_en_favor: 'solicitante', metodo: 'boton' }) });
		alert('Confirmación registrada (demo). Ambas partes deben pulsar “Se cumplió”.');
	}
</script>
<svelte:head><title>Favores | ProyectoOneDrive</title></svelte:head>
<h1 class="text-xl font-bold">Cadena de favores</h1>
<p class="mt-1 text-sm text-stone-600">RF09-RF11: Abierto → Acordado/en_curso → Cerrado con confirmación mutua “Se cumplió”.</p>
<a class="mt-3 inline-block rounded bg-amber-700 px-4 py-3 font-medium text-white" href="/publicar?tipo=favor">Pedir u ofrecer favor</a>
<ul class="mt-4 grid gap-3">
	{#if items.length === 0}<li class="rounded border bg-white p-4">Sin favores publicados.</li>{/if}
	{#each items as f}
		<li class="rounded-xl border bg-white p-4"><h2 class="font-semibold">{f.titulo}</h2><p class="text-sm">{f.descripcion}</p><p class="mt-1 text-xs">Estado: <strong>{f.estado}</strong></p><button class="mt-2 rounded border px-3 py-2 text-sm" onclick={() => cerrarDemo(f.id)}>Se cumplió (demo)</button></li>
	{/each}
</ul>
