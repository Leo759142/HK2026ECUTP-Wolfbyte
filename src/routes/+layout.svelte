<script lang="ts">
	import '../app.css';
	import '../accesibilidad/tokens.css';
	import { page } from '$app/state';
	import { browser } from '$app/env';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { guardarSesionLocal, obtenerSesionLocal } from '../lib/onboarding';
	import Icon from '../lib/ui/Icon.svelte';
	import {
		descartarOperacion,
		iniciarOutbox,
		pendientesEnvio,
		requierenAtencion,
		sincronizarAhora,
		sincronizando
	} from '../sync/outbox.svelte';
	let { children } = $props();
	let pendientes = $derived($pendientesEnvio.length);
	let atencion = $derived($requierenAtencion);
	let enSync = $derived($sincronizando);
	let verAtencion = $state(false);
	let rutaActual = $derived(page.url.pathname);
	let anchoPantalla = $derived(browser ? window.innerWidth : 0);
	let esMovil = $derived(anchoPantalla < 768);
	let esDesktop = $derived(anchoPantalla >= 768);
	const navItems = [
		{ href: '/', icon: 'home', label: 'Inicio' },
		{ href: '/favores', icon: 'favores', label: 'Favores' },
		{ href: '/mapa', icon: 'mapa', label: 'Mapa' },
		{ href: '/perfil', icon: 'perfil', label: 'Yo' }
	];

	onMount(() => {
		if (!browser) return;
		const actualizar = () => {
			anchoPantalla = window.innerWidth;
		};
		window.addEventListener('resize', actualizar);
		return () => window.removeEventListener('resize', actualizar);
	});

	onMount(async () => {
		iniciarOutbox();
		if (rutaActual === '/acceso') return;
		const sesionLocal = obtenerSesionLocal();
		if (!sesionLocal) {
			await goto('/acceso');
			return;
		}

		try {
			const respuesta = await fetch('/api/v1/auth');
			const estado = (await respuesta.json()) as {
				loggedIn?: boolean;
				usuarioId?: string;
				rol?: string;
			};
			if (estado.loggedIn && estado.usuarioId) {
				guardarSesionLocal({
					usuarioId: estado.usuarioId,
					rol: estado.rol,
					expiraEn: Date.now() + 24 * 60 * 60 * 1000
				});
				return;
			}
		} catch {
			// El modo local permite continuar si el servidor no está disponible.
		}
		// La sesión local permite trabajar sin conexión; el servidor se sincroniza al volver.
	});

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

<a
	class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-white focus:p-2"
	href="#contenido">Saltar al contenido</a>

{#if pendientes > 0 || atencion.length > 0}
	<section class="mobile-sync-bar" aria-live="polite">
		{#if atencion.length > 0}
			<button
				class="sync-button sync-button--danger"
				aria-expanded={verAtencion}
				onclick={() => (verAtencion = !verAtencion)}
			>
				Requiere atención ({atencion.length})
			</button>
		{:else}
			<button class="sync-button" onclick={sincronizarAhora} disabled={enSync}>
				{enSync ? 'Sincronizando…' : `Pendiente de enviar (${pendientes})`}
			</button>
		{/if}
	</section>
{/if}
{#if verAtencion && atencion.length > 0}
	<section class="attention-panel" aria-label="Envíos que requieren atención">
		<ul class="grid gap-2">
			{#each atencion as op (op.op_id)}
				<li class="flex flex-wrap items-center gap-2 rounded border border-red-200 bg-red-50 p-2">
					<span class="font-medium">{op.entidad}</span>
					<span class="text-red-800"
						>{op.estado === 'conflicto' ? 'Conflicto' : 'Rechazada'}: {motivo(op.error)}</span
					>
					<button
						class="ml-auto rounded border px-2 py-1"
						onclick={() => descartarOperacion(op.op_id)}>Descartar</button
					>
				</li>
			{/each}
		</ul>
	</section>
{/if}
<main id="contenido" class="app-shell">{@render children()}</main>

{#if esMovil}
	<nav class="bottom-nav" aria-label="Navegación de la aplicación">
		{#each navItems.slice(0, 2) as item}
			<a
				class:active={rutaActual === item.href}
				href={item.href}
				aria-current={rutaActual === item.href ? 'page' : undefined}
			>
				<Icon name={item.icon} size={22} />
				<span>{item.label}</span>
			</a>
		{/each}
		<a class="publish-button" href="/publicar" aria-label="Publicar">
			<Icon name="publicar" size={28} />
		</a>
		{#each navItems.slice(2) as item}
			<a
				class:active={rutaActual === item.href}
				href={item.href}
				aria-current={rutaActual === item.href ? 'page' : undefined}
			>
				<Icon name={item.icon} size={22} />
				<span>{item.label}</span>
			</a>
		{/each}
	</nav>
{:else}
	<header class="desktop-header">
		<div class="desktop-brand">AYNI</div>
		<nav class="desktop-nav" aria-label="Navegación principal">
			{#each navItems as item}
				<a
					href={item.href}
					class:active={rutaActual === item.href}
					aria-current={rutaActual === item.href ? 'page' : undefined}
				>
					<Icon name={item.icon} size={20} />
					{item.label}
				</a>
			{/each}
		</nav>
		<div class="desktop-actions">
			<button class="mobile-btn mobile-btn--outline" onclick={() => goto('/publicar')}>
				<Icon name="publicar" size={20} /> Publicar
			</button>
		</div>
	</header>
{/if}