<script lang="ts">
	import { onMount } from 'svelte';

	let nombre = $state('Rosa');

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

	const recomendados = [
		{
			emoji: '🔧',
			nombre: 'Luis · Gasfitero',
			detalle: 'A 2 cuadras · Lun–Sáb, 8am–6pm',
			votos: '👍 12 · puntual · precio'
		},
		{
			emoji: '🧵',
			nombre: 'Carmen · Costurera',
			detalle: 'A 3 cuadras · Lun–Sáb, 9am–7pm',
			votos: '👍 9 · rápida · amable'
		},
		{
			emoji: '📚',
			nombre: 'Mariela · Profesora',
			detalle: 'A 4 cuadras · Tardes, 3pm–7pm',
			votos: '👍 7 · recomendada'
		}
	];
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
	<div class="category-grid">
		{#each categorias as [emoji, label]}
			<a href="/servicios" class="category-card"
				><span aria-hidden="true">{emoji}</span><small>{label}</small></a
			>
		{/each}
		<a href="/servicios" class="category-card"
			><span aria-hidden="true">＋</span><small>Ver todo</small></a
		>
	</div>

	<div class="app-section-title">
		<h2>Los más recomendados</h2>
		<a href="/mapa">Ver mapa</a>
	</div>
	<div class="recommendations">
		{#each recomendados as servicio}
			<a href="/servicios" class="service-card">
				<div class="service-card__image" aria-hidden="true">{servicio.emoji}</div>
				<div class="service-card__content">
					<strong>{servicio.nombre}</strong>
					<small>📍 {servicio.detalle}</small>
					<span>{servicio.votos}</span>
				</div>
			</a>
		{/each}
	</div>

	<a href="/publicar?tipo=servicio" class="publish-prompt">
		<span aria-hidden="true">🛠️</span>
		<span
			><strong>¿Tienes un oficio o vendes algo?</strong><small
				>Ofrécelo a tus vecinos en 3 clics.</small
			></span
		>
	</a>
</section>
