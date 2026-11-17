<script lang="ts">
	import 'leaflet/dist/leaflet.css';
	import '../app.css';
	import '../accesibilidad/tokens.css';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/env';
	import Icono from '../lib/iconos/Icono.svelte';
	import { guardarSesionLocal, obtenerSesionLocal } from '../lib/onboarding';
	import {
		descartarOperacion,
		iniciarOutbox,
		pendientesEnvio,
		requierenAtencion,
		sincronizarAhora,
		sincronizando
	} from '../sync/outbox.svelte';
	import { gestorIdiomas, obtenerIdiomaDesdeURL, normalizarIdioma } from '../i18n';
	import { modoEmergencia } from '../lib/emergencia/estado.svelte';
	import FlotanteIzquierda from '../lib/ui/FlotanteIzquierda.svelte';
	let { children } = $props();
	let enEmergencia = $derived(modoEmergencia.activa);
	let sesionLocal = $derived(obtenerSesionLocal());
	let enLinea = $state(browser ? navigator.onLine : true);
	let esGuardianLayout = $derived(
		!!sesionLocal &&
			(sesionLocal.rol?.toLowerCase().includes('guardian') ||
				sesionLocal.rol?.toLowerCase().includes('coordinador'))
	);
	let pendientes = $derived($pendientesEnvio.length);
	let atencion = $derived($requierenAtencion);
	let enSync = $derived($sincronizando);
	let verAtencion = $state(false);
	let rutaActual = $derived(page.url.pathname);
	let autenticado = $state(false);
	let mostrarInterfazApp = $derived(autenticado && rutaActual !== '/acceso');
	const navItems = [
		{ href: '/', icon: 'inicio', label: 'Inicio' },
		{ href: '/favores', icon: 'favores', label: 'Favores' },
		{ href: '/mapa', icon: 'mapa', label: 'Mapa' },
		{ href: '/perfil', icon: 'perfil', label: 'Yo' }
	];
	const idiomasDisponibles = [
		{ codigo: 'es', nombre: 'Español', iso: 'spa', glottolog: 'stan1288' },
		{ codigo: 'en', nombre: 'English', iso: 'eng', glottolog: 'stan1291' },
		{ codigo: 'qu', nombre: 'Qhichwa', iso: 'qu0', glottolog: 'cusc1238' }
	];

	if (browser) {
		const idiomaURL = obtenerIdiomaDesdeURL();
		if (idiomaURL) {
			gestorIdiomas.cambiarIdioma(normalizarIdioma(idiomaURL));
		}
	}
	$effect(() => {
		if (!browser) return;
		const onOnline = () => (enLinea = true);
		const onOffline = () => (enLinea = false);
		window.addEventListener('online', onOnline);
		window.addEventListener('offline', onOffline);
		return () => {
			window.removeEventListener('online', onOnline);
			window.removeEventListener('offline', onOffline);
		};
	});
	$effect(() => {
		if (rutaActual === '/acceso') {
			autenticado = false;
			return;
		}
		autenticado = Boolean(obtenerSesionLocal());
	});

	onMount(async () => {
		iniciarOutbox();
		if (rutaActual === '/acceso') return;
		// Permitir página de emergencia sin sesión (acceso abierto)
		if (rutaActual === '/emergencia') {
			autenticado = false;
			return;
		}
		const sesionLocal = obtenerSesionLocal();
		// Validar que la sesión corresponda a un usuario existente
		if (sesionLocal) {
			try {
				const usuarios = JSON.parse(localStorage.getItem('ayni:v1:users') ?? '[]') as Array<{
					id?: string;
				}>;
				const existe = usuarios.some((u) => u.id === sesionLocal.usuarioId);
				if (!existe) {
					localStorage.removeItem('ayni:v1:session');
					await goto('/acceso');
					return;
				}
			} catch {
				/* ignore */
			}
		}
		const rutasProtegidas = ['/perfil', '/publicar', '/moderacion'];
		const requiereSesion = rutasProtegidas.some(
			(r) => rutaActual === r || rutaActual.startsWith(r + '/')
		);
		// Rutas que requieren rol Guardián/Coordinador
		const rutasGuardian = ['/perfil/guardian', '/moderacion'];
		const requiereGuardian = rutasGuardian.some(
			(r) => rutaActual === r || rutaActual.startsWith(r + '/')
		);
		if (requiereSesion && !sesionLocal) {
			await goto('/acceso');
			return;
		}
		if (requiereGuardian) {
			const rol = (sesionLocal?.rol ?? '').toLowerCase();
			const esGuardian = rol.includes('guardian') || rol.includes('coordinador');
			if (!esGuardian) {
				await goto('/');
				return;
			}
		}
		if (!sesionLocal) {
			await goto('/acceso');
			return;
		}
		autenticado = true;

		try {
			const respuesta = await fetch('/api/v1/auth');
			if (respuesta.ok) {
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
			}
		} catch {
			// El modo local permite continuar si el servidor no está disponible.
		}
		// La sesión local permite trabajar sin conexión; el servidor se sincroniza al volver.
	});

	function motivo(error: string | null | undefined): string {
		if (!error) return gestorIdiomas.t('error.outbox.motivo_default');
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
	href="#contenido">Saltar al contenido</a
>
{#if mostrarInterfazApp && (pendientes > 0 || atencion.length > 0)}
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
{#if mostrarInterfazApp && verAtencion && atencion.length > 0}
	<section class="attention-panel" aria-label="Envíos que requieren atención">
		<ul class="grid gap-2">
			{#each atencion as op (op.op_id)}
				<li class="flex flex-wrap items-center gap-2 rounded border border-red-200 bg-red-50 p-2">
					<span class="font-medium">{op.entidad}</span>
					<span class="text-red-800"
						>{op.estado === 'conflicto'
							? gestorIdiomas.t('error.outbox.conflicto')
							: gestorIdiomas.t('error.outbox.rechazada')}: {motivo(op.error)}</span
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
<header
	style="display:flex; justify-content: center;"
	class={enEmergencia && rutaActual === '/' ? 'app-brand hidden' : 'app-brand'}
	aria-label="AYNI"
>
	<img src="/icon-192.png" alt="AYNI" width="64" height="64" />
	<span style="font-size: 32px">AYNI</span>
	<div class="ml-4 flex items-center gap-1">
		{#if enLinea}
			<span class="bg-wa h-2.5 w-2.5 rounded-full" aria-hidden="true"></span>
			<span class="text-tinta text-xs font-bold">{gestorIdiomas.t('header.conectado')}</span>
		{:else}
			<span class="bg-ambar h-2.5 w-2.5 rounded-full" aria-hidden="true"></span>
			<span class="text-tinta text-xs font-bold">{gestorIdiomas.t('header.sinConexion')}</span>
		{/if}
	</div>
</header>

{#if mostrarInterfazApp && enEmergencia && rutaActual !== '/'}
	<div class="emergency-global-banner" role="alert">
		<span><Icono name="alerta" /> Modo emergencia · {modoEmergencia.tipo}</span>
		<a href="/" class="emergency-global-banner__volver">Volver a Inicio</a>
		{#if esGuardianLayout}
			<button
				type="button"
				class="emergency-global-banner__cerrar"
				onclick={() => modoEmergencia.desactivar()}
			>
				Cerrar emergencia
			</button>
		{/if}
	</div>
{/if}
<main
	id="contenido"
	class="app-shell"
	class:acceso={rutaActual === '/acceso'}
	class:sin-nav={enEmergencia}
>
	{@render children()}
</main>
{#if mostrarInterfazApp && !enEmergencia}
	<nav class="bottom-nav" aria-label="Navegación de la aplicación">
		{#each navItems.slice(0, 2) as item}
			<a
				class:active={rutaActual === item.href}
				href={item.href}
				aria-current={rutaActual === item.href ? 'page' : undefined}
			>
				<span class="bottom-nav__icon" aria-hidden="true"><Icono name={item.icon} /></span>
				<span>{item.label}</span>
			</a>
		{/each}
		<a class="publish-button" href="/publicar" aria-label="Publicar">
			<span aria-hidden="true"><Icono name="agregar" /></span>
		</a>
		{#each navItems.slice(2) as item}
			<a
				class:active={rutaActual === item.href}
				href={item.href}
				aria-current={rutaActual === item.href ? 'page' : undefined}
			>
				<span class="bottom-nav__icon" aria-hidden="true"><Icono name={item.icon} /></span>
				<span>{item.label}</span>
			</a>
		{/each}

		<!-- Selector de idioma -->
		<select
			class="lang-combobox"
			aria-label="Cambiar idioma"
			value={gestorIdiomas.idiomaActual}
			onchange={(e) =>
				gestorIdiomas.cambiarIdioma(
					(e.currentTarget as HTMLSelectElement).value as typeof gestorIdiomas.idiomaActual
				)}
		>
			{#each idiomasDisponibles as idioma}
				<option
					value={idioma.codigo}
					title={`${idioma.nombre} (ISO: ${idioma.iso}, Glottolog: ${idioma.glottolog})`}
				>
					{idioma.codigo.toUpperCase()} · {idioma.nombre}
				</option>
			{/each}
		</select>
	</nav>
{/if}

<FlotanteIzquierda />
