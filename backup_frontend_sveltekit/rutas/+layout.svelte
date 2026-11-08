<script lang="ts">
	import '../accesibilidad/tokens.css';
	import { onMount } from 'svelte';
	import { descartarOperacion, iniciarOutbox, pendientesEnvio, requierenAtencion, sincronizarAhora, sincronizando } from '../sync/outbox.svelte';
	let { children } = $props();
	let pendientes = $derived($pendientesEnvio.length);
	let atencion = $derived($requierenAtencion);
	let enSync = $derived($sincronizando);
	let verAtencion = $state(false);
	onMount(() => iniciarOutbox());

	function motivo(error: string | null | undefined): string {
		if (!error) return 'El servidor no aceptó este envío.';
		try {
			const p = JSON.parse(error);
			return p.detail ?? p.title ?? error;
		} catch {
			return error;
		}
	}
</script>

<a class="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:p-2" href="#contenido">Saltar al contenido</a>
<header class="border-b bg-white">
	<nav class="mx-auto flex max-w-5xl flex-wrap items-center gap-3 p-3 text-sm" aria-label="Principal">
		<a class="font-semibold" href="/">ProyectoOneDrive</a>
		<a href="/servicios">Servicios</a>
		<a href="/favores">Favores</a>
		<a href="/emergencia">Emergencia</a>
		<a href="/mapa">Mapa</a>
		<a href="/publicar">Publicar</a>
		<a href="/perfil">Perfil</a>
		<a href="/api/docs">Swagger</a>
		<span class="ml-auto flex items-center gap-2" aria-live="polite">
			{#if atencion.length > 0}
				<button class="rounded border border-red-300 bg-red-50 px-2 py-1 text-red-800" aria-expanded={verAtencion} onclick={() => (verAtencion = !verAtencion)}>
					Requiere atención ({atencion.length})
				</button>
			{/if}
			{#if pendientes > 0}
				<button class="rounded border px-2 py-1" onclick={sincronizarAhora} disabled={enSync}>{enSync ? 'Sincronizando…' : `Pendiente de enviar (${pendientes})`}</button>
			{:else if atencion.length === 0}
				<span class="text-stone-500">Sincronizado</span>
			{/if}
		</span>
	</nav>
	{#if verAtencion && atencion.length > 0}
		<section class="mx-auto max-w-5xl px-3 pb-3 text-sm" aria-label="Envíos que requieren atención">
			<ul class="grid gap-2">
				{#each atencion as op (op.op_id)}
					<li class="flex flex-wrap items-center gap-2 rounded border border-red-200 bg-red-50 p-2">
						<span class="font-medium">{op.entidad}</span>
						<span class="text-red-800">{op.estado === 'conflicto' ? 'Conflicto' : 'Rechazada'}: {motivo(op.error)}</span>
						<button class="ml-auto rounded border px-2 py-1" onclick={() => descartarOperacion(op.op_id)}>Descartar</button>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</header>
<main id="contenido" class="mx-auto max-w-5xl p-4">{@render children()}</main>
