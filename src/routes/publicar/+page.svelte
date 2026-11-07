<script lang="ts">
	import { page } from '$app/state';
	let paso = $state(1);
	let tipo = $derived(page.url.searchParams.get('tipo') ?? 'servicio');
	let mensaje = $state('');
	let error = $state('');
	let form = $state({ zona_id: 'zona-demo', titulo: '', descripcion: '', categoria: 'otro', tipo_favor: 'necesidad', categoria_favor: 'otro', tipo_alerta: 'otro', lat_aprox: -12.046, lng_aprox: -77.043 });

	async function enviar() {
		error = ''; mensaje = '';
		try {
			const path = tipo === 'favor' ? '/api/v1/favores' : tipo === 'alerta' ? '/api/v1/alertas' : '/api/v1/servicios';
			const body = tipo === 'favor'
				? { zona_id: form.zona_id, tipo: form.tipo_favor, categoria: form.categoria_favor, titulo: form.titulo, descripcion: form.descripcion, lat_aprox: form.lat_aprox, lng_aprox: form.lng_aprox }
				: tipo === 'alerta'
				? { zona_id: form.zona_id, tipo: form.tipo_alerta, descripcion: form.descripcion || form.titulo, lat_aprox: form.lat_aprox, lng_aprox: form.lng_aprox }
				: { zona_id: form.zona_id, categoria: form.categoria, titulo: form.titulo, descripcion: form.descripcion, lat_aprox: form.lat_aprox, lng_aprox: form.lng_aprox };
			const r = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify(body) });
			if (!r.ok) throw new Error((await r.json().catch(() => ({}))).detail ?? 'No se pudo publicar');
			paso = 3; mensaje = 'Publicación guardada. Estado: Pendiente de enviar o Enviada según conectividad.';
		} catch (e) { error = e instanceof Error ? e.message : 'Error al publicar. Revisa los campos e intenta de nuevo.'; }
	}
</script>

<svelte:head><title>Publicar | ProyectoOneDrive</title></svelte:head>
<h1 class="text-xl font-bold">Publicar en 3 pasos</h1>
<p class="text-sm text-stone-600">RF05/RF09/RF13/RF17/RF25: flujo corto, errores corregibles, escritura segura offline.</p>
<div class="mt-4 max-w-2xl rounded-xl border bg-white p-4">
	<p class="text-sm font-medium">Paso {paso} de 3 · {tipo}</p>
	{#if error}<p class="mt-3 rounded border border-red-200 bg-red-50 p-3 text-sm" role="alert">{error}</p>{/if}
	{#if paso === 1}
		<label class="mt-3 block text-sm">Tipo
			<select class="mt-1 w-full rounded border p-3" bind:value={tipo}><option value="servicio">Servicio</option><option value="favor">Favor</option><option value="alerta">Alerta</option></select>
		</label>
		<button class="mt-4 rounded bg-stone-900 px-4 py-3 text-white" onclick={() => (paso = 2)}>Continuar</button>
	{:else if paso === 2}
		<label class="mt-3 block text-sm">Título<input class="mt-1 w-full rounded border p-3" bind:value={form.titulo} maxlength="80" required /></label>
		<label class="mt-3 block text-sm">Descripción<textarea class="mt-1 w-full rounded border p-3" bind:value={form.descripcion} maxlength="500" rows="4"></textarea></label>
		{#if tipo === 'servicio'}<label class="mt-3 block text-sm">Categoría<select class="mt-1 w-full rounded border p-3" bind:value={form.categoria}><option>gasfiteria</option><option>electricidad</option><option>carpinteria</option><option>cerrajeria</option><option>comida</option><option>cuidado</option><option>otro</option></select></label>{/if}
		{#if tipo === 'favor'}<label class="mt-3 block text-sm">Tipo<select class="mt-1 w-full rounded border p-3" bind:value={form.tipo_favor}><option value="necesidad">Necesidad</option><option value="oferta">Oferta</option></select></label>{/if}
		{#if tipo === 'alerta'}<label class="mt-3 block text-sm">Tipo de alerta<select class="mt-1 w-full rounded border p-3" bind:value={form.tipo_alerta}><option>persona_vulnerable</option><option>zona_inundada</option><option>sin_servicios_basicos</option><option>riesgo_estructural</option><option>otro</option></select></label>{/if}
		<p class="mt-3 text-xs text-stone-600">Ubicación aproximada: se enmascara a sector/manzana (RF19). No publiques dirección exacta.</p>
		<div class="mt-4 flex gap-2"><button class="rounded border px-4 py-3" onclick={() => (paso = 1)}>Atrás</button><button class="rounded bg-teal-700 px-4 py-3 text-white" onclick={enviar}>Publicar</button></div>
	{:else}
		<p class="mt-3 rounded border border-green-200 bg-green-50 p-3 text-sm" role="status">{mensaje}</p>
		<div class="mt-4 flex gap-2"><a class="rounded bg-stone-900 px-4 py-3 text-white" href="/">Ir al inicio</a><button class="rounded border px-4 py-3" onclick={() => { paso = 1; form.titulo=''; form.descripcion=''; mensaje=''; }}>Publicar otra</button></div>
	{/if}
</div>

