<script lang="ts">
	import '../accesibilidad/tokens.css';
	import { onMount } from 'svelte';
	import { iniciarOutbox, operacionesOutbox, sincronizarAhora, sincronizando } from '../sync/outbox.svelte';
	let { children } = $props();
	let pendientes = $derived($operacionesOutbox.length);
	let enSync = $derived($sincronizando);
	onMount(() => iniciarOutbox());
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
			{#if pendientes > 0}
				<button class="rounded border px-2 py-1" onclick={sincronizarAhora} disabled={enSync}>{enSync ? 'Sincronizando…' : `Pendiente de enviar (${pendientes})`}</button>
			{:else}
				<span class="text-stone-500">Sincronizado</span>
			{/if}
		</span>
	</nav>
</header>
<main id="contenido" class="mx-auto max-w-5xl p-4">{@render children()}</main>
