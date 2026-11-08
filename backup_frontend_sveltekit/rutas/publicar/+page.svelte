<script lang="ts">
	import { page } from '$app/state';
	import { encolarAccion } from '../../sync/outbox.svelte';
import type { Servicio, CategoriaServicio } from '../../dominio/tipos/tipos';
	import { construirPublicacion, tipoDesdeUrl, type TipoPublicacion } from '#lib/publicar';
	import { PublicarServicio, obtenerUsuarioCliente } from '../../aplicacion/servicios';
	import { ServicioRepoLocal } from '../../repositorios/servicio.local';

	const publicarServicio = new PublicarServicio(new ServicioRepoLocal());
	let paso = $state(1);
	// $state (no $derived) porque el select lo modifica.
	let tipo = $state<TipoPublicacion>(tipoDesdeUrl(page.url.searchParams.get('tipo')));
	let mensaje = $state('');
	let error = $state('');
	let guardando = $state(false);
	let form = $state({ zona_id: 'zona-demo', titulo: '', descripcion: '', categoria: 'otro', tipo_favor: 'necesidad', categoria_favor: 'otro', tipo_alerta: 'otro', lat_aprox: -12.046, lng_aprox: -77.043 });

	async function enviar() {
		error = '';
		mensaje = '';
		const pub = construirPublicacion(tipo, form);
		if (!pub.ok) {
			error = pub.error;
			return;
		}
		guardando = true;
		try {
			if (tipo === 'servicio') {
				// Escritura por capa de servicio + repositorio (DAO local + outbox, offline-first).
				const creado = await publicarServicio.ejecutar({
					usuario_id: obtenerUsuarioCliente(),
					zona_id: form.zona_id,
					categoria: form.categoria as CategoriaServicio,
					titulo: form.titulo.trim(),
					descripcion: form.descripcion.trim(),
					lat_aprox: form.lat_aprox,
					lng_aprox: form.lng_aprox,
				});
				mensaje = `Servicio “${creado.titulo}” guardado. Se enviará cuando haya señal.`;
			} else {
				// Favor y alerta siguen yendo a la cola de salida directamente.
				await encolarAccion(pub.entidad, pub.body);
				const enLinea = typeof navigator === 'undefined' || navigator.onLine !== false;
				mensaje = enLinea
					? 'Publicación guardada. Enviando… (mira el estado arriba a la derecha).'
					: 'Publicación guardada en tu celular: Pendiente de enviar. Se enviará sola al volver la señal.';
			}
			paso = 3;
		} catch {
			error = 'No se pudo guardar. Intenta de nuevo.';
		} finally {
			guardando = false;
		}
	}

	function otra() {
		paso = 1;
		form.titulo = '';
		form.descripcion = '';
		mensaje = '';
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
		<label class="mt-3 block text-sm">Descripción<textarea class="mt-1 w-full rounded border p-3" bind:value={form.descripcion} maxlength={tipo === 'alerta' ? 300 : 500} rows="4"></textarea></label>
		{#if tipo === 'servicio'}<label class="mt-3 block text-sm">Categoría<select class="mt-1 w-full rounded border p-3" bind:value={form.categoria}><option>gasfiteria</option><option>electricidad</option><option>carpinteria</option><option>cerrajeria</option><option>comida</option><option>cuidado</option><option>otro</option></select></label>{/if}
		{#if tipo === 'favor'}<label class="mt-3 block text-sm">Tipo<select class="mt-1 w-full rounded border p-3" bind:value={form.tipo_favor}><option value="necesidad">Necesidad</option><option value="oferta">Oferta</option></select></label>{/if}
		{#if tipo === 'alerta'}<label class="mt-3 block text-sm">Tipo de alerta<select class="mt-1 w-full rounded border p-3" bind:value={form.tipo_alerta}><option>persona_vulnerable</option><option>zona_inundada</option><option>sin_servicios_basicos</option><option>riesgo_estructural</option><option>otro</option></select></label>{/if}
		<p class="mt-3 text-xs text-stone-600">Ubicación aproximada: se enmascara a sector/manzana (RF19). No publiques dirección exacta.</p>
		<div class="mt-4 flex gap-2"><button class="rounded border px-4 py-3" onclick={() => (paso = 1)}>Atrás</button><button class="rounded bg-teal-700 px-4 py-3 text-white" onclick={enviar} disabled={guardando}>{guardando ? 'Guardando…' : 'Publicar'}</button></div>
	{:else}
		<p class="mt-3 rounded border border-green-200 bg-green-50 p-3 text-sm" role="status">{mensaje}</p>
		<div class="mt-4 flex gap-2"><a class="rounded bg-stone-900 px-4 py-3 text-white" href="/">Ir al inicio</a><button class="rounded border px-4 py-3" onclick={otra}>Publicar otra</button></div>
	{/if}
</div>
