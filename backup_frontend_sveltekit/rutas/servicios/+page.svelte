<script lang="ts">
	import { onMount } from 'svelte';
        import type { Servicio } from '../../dominio/tipos/tipos';
        import { ListarServicios } from '../../aplicacion/servicios';
        import { ServicioRepoLocal } from '../../repositorios/servicio.local';

        const listarServicios = new ListarServicios(new ServicioRepoLocal());
	let items = $state<Servicio[]>([]);
        let error = $state('');
	let estado = $state<'cargando' | 'ok' | 'error'>('cargando');
	onMount(async () => {
		try {
			items = await listarServicios.ejecutar();
			
			estado = 'ok';
		} catch {
			estado = 'error';
                        error = 'No se pudieron cargar los servicios. Intenta de nuevo.';
		}
	});
</script>

<svelte:head><title>Servicios | ProyectoOneDrive</title></svelte:head>
<h1 class="text-xl font-bold">Servicios de proximidad</h1>
<p class="mt-1 text-sm text-stone-600">RF05-RF08: publicar/buscar oficios con Visto Bueno y etiqueta funcional.</p>
<a class="mt-3 inline-block rounded bg-teal-700 px-4 py-3 font-medium text-white" href="/publicar?tipo=servicio">Publicar servicio</a>
{#if estado === 'cargando'}<p class="mt-4" role="status">Cargando servicios…</p>
{:else if estado === 'error'}<p class="mt-4 rounded border border-red-200 bg-red-50 p-3" role="alert">No se pudo cargar. Si estás sin señal, se mostrarán datos locales cuando la capa SQLite/IDB esté conectada.</p>
{:else if items.length === 0}<p class="mt-4 rounded border bg-white p-4">Sin servicios aún. Publica el primero en 3 pasos.</p>
{:else}
	<ul class="mt-4 grid gap-3">
		{#each items as s}
			<li class="rounded-xl border bg-white p-4"><h2 class="font-semibold">{s.titulo}</h2><p class="text-sm">{s.descripcion}</p><p class="mt-1 text-xs text-stone-600">Categoría: {s.categoria} · Ubicación aproximada</p><p class="mt-2 text-xs font-medium text-teal-800">Etiqueta: Sin recomendaciones aún / Visto Bueno</p></li>
		{/each}
	</ul>
{/if}
