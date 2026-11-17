<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Icono from '../lib/iconos/Icono.svelte';
	import { modoEmergencia } from '../lib/emergencia/estado.svelte';
	import { obtenerSesionLocal } from '../lib/onboarding';

	let nombre = $state('Rosa');
	type ServicioInicio = {
		id: string;
		titulo?: string;
		descripcion?: string;
		categoria?: string;
		foto?: string | null;
		fotos?: string[];
	};
	let recomendados = $state<ServicioInicio[]>([]);

	let esGuardian = $state(false);
	let marqueEstoyBien = $state(false);
	let lugarSector = $state('tu sector');

	onMount(() => {
		try {
			const usuarios = JSON.parse(localStorage.getItem('ayni:v1:users') ?? '[]') as Array<{
				firstName?: string;
			}>;
			const sesion = JSON.parse(localStorage.getItem('ayni:v1:session') ?? '{}') as {
				usuarioId?: string;
			};
			const usuario =
				sesion.usuarioId
					? usuarios.find((item) => (item as { id?: string }).id === sesion.usuarioId)
					: undefined;
			if (usuario?.firstName) nombre = usuario.firstName;
		} catch {
			nombre = 'Rosa';
		}

		const rol = obtenerSesionLocal()?.rol?.toLowerCase() ?? '';
		esGuardian =
			rol.includes('guardian') ||
			rol.includes('coordinador') ||
			leerGuardianes()?.includes(obtenerSesionLocal()?.usuarioId ?? '') === true;

		const usuarios = JSON.parse(localStorage.getItem('ayni:v1:users') ?? '[]') as Array<{
			manzana?: string;
			firstName?: string;
		}>;
		const sesionActiva = obtenerSesionLocal();
		const usuario = sesionActiva?.usuarioId
			? usuarios.find((item) => (item as { id?: string }).id === sesionActiva.usuarioId)
			: undefined;
		if (usuario?.manzana) lugarSector = `Mz. ${usuario.manzana}`;
	});

	const categorias = [
		['gasfiteria', 'Gasfitería'],
		['electricidad', 'Electricidad'],
		['carpinteria', 'Carpintería'],
		['costura', 'Costura'],
		['clases', 'Clases'],
		['mascotas', 'Mascotas'],
		['comida', 'Comida']
	];

	const nombreCategoria = (categoria?: string) =>
		categoria ? categoria.charAt(0).toUpperCase() + categoria.slice(1) : 'Servicio';

	function leerGuardianes(): string[] | undefined {
		try {
			const sectores = JSON.parse(localStorage.getItem('ayni:v1:sectors') ?? '[]') as Array<{
				guardianIds?: string[];
			}>;
			const ids = sectores.flatMap((s) => s.guardianIds ?? []);
			return ids.length ? ids : undefined;
		} catch {
			return undefined;
		}
	}

	onMount(async () => {
		try {
			const respuesta = await fetch('/api/v1/servicios');
			if (respuesta.ok) {
				const cuerpo = (await respuesta.json()) as { items?: ServicioInicio[] };
				recomendados = (cuerpo.items ?? []).slice(0, 3);
			}
		} catch {
			recomendados = [];
		}
	});

	function pedirAyuda() {
		goto('/pedir-ayuda');
	}
	function verQuePasa() {
		goto('/mapa');
	}
	function marcarEstoyBien() {
		marqueEstoyBien = true;
		const id = obtenerSesionLocal()?.usuarioId ?? 'anon';
		const key = 'ayni:v1:estoy-bien';
		const lista = JSON.parse(localStorage.getItem(key) ?? '[]') as string[];
		if (!lista.includes(id)) {
			lista.push(id);
			localStorage.setItem(key, JSON.stringify(lista));
		}
	}
</script>

<svelte:head><title>AYNI | Inicio</title></svelte:head>

{#if modoEmergencia.activa}
	<section class="emergency-takeover">
		<div class="emergency-takeover__bar" role="alert">
			<Icono name="alerta" />
			<span>Modo emergencia · {modoEmergencia.tipo}</span>
		</div>

		<div class="emergency-takeover__body">
			<div class="emergency-takeover__icon"><Icono name="emergencia" /></div>
			<h1 tabindex="-1" autofocus>EMERGENCIA EN TU SECTOR</h1>
			<p class="emergency-takeover__title">{modoEmergencia.titulo}</p>
			<p class="emergency-takeover__meta">
				Confirmada por {modoEmergencia.confirmadaPor} {modoEmergencia.inicioFormateado ? `· ${modoEmergencia.inicioFormateado}` : ''}
			</p>

			<div class="emergency-takeover__numbers">
				<a href="tel:105">105 <span>Policía</span></a>
				<a href="tel:116">116 <span>Bomberos</span></a>
				<a href="tel:106">106 <span>SAMU</span></a>
			</div>

			<div class="emergency-takeover__actions">
				<button
					class="emergency-takeover__btn emergency-takeover__btn--white"
					type="button"
					disabled={marqueEstoyBien}
					onclick={marcarEstoyBien}
				>
					<Icono name={marqueEstoyBien ? 'check' : 'corazon'} />
					{marqueEstoyBien ? 'Marcado: estoy bien' : 'Estoy bien'}
				</button>

				<button
					class="emergency-takeover__btn emergency-takeover__btn--white emergency-takeover__btn--danger-text"
					type="button"
					onclick={pedirAyuda}
				>
					<Icono name="otra_ayuda" /> Necesito ayuda
				</button>

				<button
					class="emergency-takeover__btn emergency-takeover__btn--outline"
					type="button"
					onclick={verQuePasa}
				>
					<Icono name="mapa" /> Ver qué pasa
				</button>
			</div>

			{#if esGuardian}
				<button
					class="emergency-takeover__guardian"
					type="button"
					onclick={() => modoEmergencia.desactivar()}
				>
					<Icono name="guardian" /> Cerrar emergencia (Guardián)
				</button>
			{/if}
		</div>
	</section>
{:else}
	<section class="app-screen home-screen">
	<div class="home-top">
		<div class="home-heading">
			<div class="location"><Icono name="ubicacion" /> Los Jardines · Sector 3 · Mz. B</div>
			<h1>¡Hola, {nombre}!</h1>
		</div>
		<a class="user-avatar" href="/perfil" aria-label="Mi perfil"
			>{nombre.slice(0, 1).toUpperCase()}</a
		>
	</div>

	<form class="app-search" action="/servicios" role="search">
		<span aria-hidden="true"><Icono name="buscar" /></span>
		<input name="q" aria-label="¿Qué necesitas hoy?" placeholder="¿Qué necesitas hoy?" />
	</form>

	<a class="emergency-card" href="/emergencia">
		<span aria-hidden="true"><Icono name="emergencia" /></span>
		<span>¿Pasa algo grave? <strong>Reportar emergencia</strong></span>
	</a>

	<div class="app-section-title">
		<h2>Oficios del barrio</h2>
	</div>
	<div class="category-grid">
		{#each categorias as [id, label]}
			<a href="/servicios?categoria={id}" class="category-card"
				><span aria-hidden="true"><Icono name={id} /></span><small>{label}</small></a
			>
		{/each}
		<a href="/servicios" class="category-card"
			><span aria-hidden="true"><Icono name="agregar" /></span><small>Ver todo</small></a
		>
	</div>

	<div class="app-section-title">
		<h2>Los más recomendados</h2>
		<a href="/mapa">Ver mapa</a>
	</div>
	<div class="recommendations">
		{#each recomendados as servicio}
			<a href="/servicios" class="service-card">
				<div class="service-card__image" aria-hidden="true">
					{#if servicio.foto || servicio.fotos?.length}<img
							src={servicio.foto ?? servicio.fotos?.[0]}
							alt=""
						/>{:else}<Icono name={servicio.categoria ?? 'servicio'} />{/if}
				</div>
				<div class="service-card__content">
					<strong>{servicio.titulo ?? nombreCategoria(servicio.categoria)}</strong>
					<small><Icono name="ubicacion" /> En tu zona · ubicación aproximada</small>
					<span>{nombreCategoria(servicio.categoria)} · Recomendado por vecinos</span>
				</div>
			</a>
		{/each}
		{#if recomendados.length === 0}<p class="empty">
				Todavía no hay servicios publicados cerca.
			</p>{/if}
	</div>

	<a href="/publicar?tipo=servicio" class="publish-prompt">
		<span aria-hidden="true"><Icono name="servicio" /></span>
		<span
			><strong>¿Tienes un oficio o vendes algo?</strong><small
				>Ofrécelo a tus vecinos en 3 clics.</small
			></span
		>
	</a>
</section>
{/if}
