<script lang="ts">
	import { onMount } from 'svelte';
	import ResponsiveGrid from '../lib/ui/ResponsiveGrid.svelte';

	let nombre = $state('Rosa');
	type ServicioInicio = {
		id: string;
		titulo?: string;
		descripcion?: string;
		categoria?: string;
		foto?: string | null;
	};
	let recomendados = $state<ServicioInicio[]>([]);

	onMount(() => {
		try {
			const usuarios = JSON.parse(localStorage.getItem('ayni:v1:users') ?? '[]') as Array<{
				firstName?: string;
			}>;
			const sesion = JSON.parse(localStorage.getItem('ayni:v1:session') ?? '{}') as {
				usuarioId?: string;
			};
			const usuario =
				usuarios.find((item, index) => item.firstName && (!sesion.usuarioId || index === 0)) ??
				usuarios[0];
			if (usuario?.firstName) nombre = usuario.firstName;
		} catch {
			nombre = 'Rosa';
		}
	});

	const categorias = [
		['🔧', 'Gasfitería'],
		['⚡', 'Electricidad'],
		['🪚', 'Carpintería'],
		['🧵', 'Costura'],
		['📚', 'Clases'],
		['🐾', 'Mascotas'],
		['🍲', 'Comida']
	];

	const iconos: Record<string, string> = {
		gasfiteria: '🔧',
		electricidad: '⚡',
		carpinteria: '🪚',
		costura: '🧵',
		clases: '📚',
		comida: '🍲'
	};

	const nombreCategoria = (categoria?: string) =>
		categoria ? categoria.charAt(0).toUpperCase() + categoria.slice(1) : 'Servicio';

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
</script>

<svelte:head>
	<title>AYNI | Inicio</title>
</svelte:head>

<section class="app-screen home-screen">
	<div class="home-top">
		<div class="home-heading">
			<div class="location">📍 Los Jardines · Sector 3 · Mz. B</div>
			<h1>¡Hola, {nombre}! 👋</h1>
		</div>
		<a class="user-avatar" href="/perfil" aria-label="Mi perfil"
			>{nombre.slice(0, 1).toUpperCase()}</a
		>
	</div>

	<div class="connection"><span></span> En línea</div>

	<form class="app-search" action="/servicios" role="search">
		<span aria-hidden="true">⌕</span>
		<input name="q" aria-label="¿Qué necesitas hoy?" placeholder="¿Qué necesitas hoy?" />
	</form>

	<a class="emergency-card" href="/emergencia">
		<span aria-hidden="true">⚠️</span>
		<span>¿Pasa algo grave? <strong>Reportar emergencia</strong></span>
	</a>

	<div class="app-section-title">
		<h2>Oficios del barrio</h2>
	</div>
	<ResponsiveGrid cols={2} gap="1rem">
		{#each categorias as [emoji, label]}
			<a href="/servicios" class="category-card"
				><span aria-hidden="true">{emoji}</span><small>{label}</small></a
			>
		{/each}
		<a href="/servicios" class="category-card"
			><span aria-hidden="true">＋</span><small>Ver todo</small></a
		>
	</ResponsiveGrid>

	<div class="app-section-title">
		<h2>Los más recomendados</h2>
		<a href="/mapa">Ver mapa</a>
	</div>
	<ResponsiveGrid cols={1} gap="1rem">
		{#each recomendados as servicio}
			<a href="/servicios" class="service-card">
				<div class="service-card__image" aria-hidden="true">
					{#if servicio.foto}<img src={servicio.foto} alt="" />{:else}{iconos[
							servicio.categoria ?? ''
						] ?? '🛠️'}{/if}
				</div>
				<div class="service-card__content">
					<strong>{servicio.titulo ?? nombreCategoria(servicio.categoria)}</strong>
					<small>📍 En tu zona · ubicación aproximada</small>
					<span>{nombreCategoria(servicio.categoria)} · Recomendado por vecinos</span>
				</div>
			</a>
		{/each}
		{#if recomendados.length === 0}<p class="empty">
				Todavía no hay servicios publicados cerca.
			</p>{/if}
	</ResponsiveGrid>

	<a href="/publicar?tipo=servicio" class="publish-prompt">
		<span aria-hidden="true">🛠️</span>
		<span
			><strong>¿Tienes un oficio o vendes algo?</strong><small
				>Ofrécelo a tus vecinos en 3 clics.</small
			></span
		>
	</a>
</section>
