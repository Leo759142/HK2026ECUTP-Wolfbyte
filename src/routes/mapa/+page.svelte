<script lang="ts">
	import { onMount } from 'svelte';

	type Punto = {
		id: string;
		titulo?: string;
		descripcion?: string;
		tipo?: string;
		lat_aprox?: number;
		lng_aprox?: number;
	};

	let servicios = $state<Punto[]>([]);
	let favores = $state<Punto[]>([]);
	let alertas = $state<Punto[]>([]);
	let capa = $state<'todos' | 'servicios' | 'favores' | 'alertas'>('todos');
	let seleccionado = $state<Punto | null>(null);
	let cargando = $state(true);
	let error = $state('');

	const visibles = $derived(
		[
			...(capa === 'todos' || capa === 'servicios'
				? servicios.map((item) => ({ ...item, tipo: 'Servicio' }))
				: []),
			...(capa === 'todos' || capa === 'favores'
				? favores.map((item) => ({ ...item, tipo: 'Favor' }))
				: []),
			...(capa === 'todos' || capa === 'alertas'
				? alertas.map((item) => ({ ...item, tipo: 'Alerta' }))
				: [])
		].slice(0, 12)
	);

	const cargar = async () => {
		cargando = true;
		error = '';
		try {
			const respuestas = await Promise.all([
				fetch('/api/v1/servicios'),
				fetch('/api/v1/favores'),
				fetch('/api/v1/alertas')
			]);
			if (respuestas.some((respuesta) => !respuesta.ok))
				throw new Error('No se pudieron cargar todos los puntos.');
			const datos = await Promise.all(respuestas.map((respuesta) => respuesta.json()));
			servicios = datos[0].items ?? [];
			favores = datos[1].items ?? [];
			alertas = datos[2].items ?? [];
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'No se pudo cargar el mapa.';
		} finally {
			cargando = false;
		}
	};

	const seleccionar = (punto: Punto) => (seleccionado = punto);

	onMount(cargar);
</script>

<svelte:head><title>Mapa | AYNI</title></svelte:head>

<section class="map-page">
	<div class="section-heading">
		<div>
			<h1>Mapa comunitario</h1>
			<p>Explora ayuda cercana con ubicaciones aproximadas.</p>
		</div>
		<button class="text-button" type="button" onclick={cargar} disabled={cargando}
			>Actualizar</button
		>
	</div>

	<div class="map-visual" aria-label="Mapa aproximado de la comunidad">
		<div class="map-grid" aria-hidden="true"></div>
		<button
			class="map-pin map-pin--one"
			aria-label="Servicios"
			onclick={() => (capa = 'servicios')}
		>
			🛠️
		</button>
		<button class="map-pin map-pin--two" aria-label="Favores" onclick={() => (capa = 'favores')}>
			🤝
		</button>
		<button class="map-pin map-pin--three" aria-label="Alertas" onclick={() => (capa = 'alertas')}>
			🚨
		</button>
		<div class="map-label">Tu zona · ubicación aproximada</div>
	</div>

	<div class="map-filters" role="tablist" aria-label="Capas del mapa">
		{#each [['todos', 'Todo'], ['servicios', 'Servicios'], ['favores', 'Favores'], ['alertas', 'Alertas']] as item}
			<button
				class:active={capa === item[0]}
				type="button"
				role="tab"
				aria-selected={capa === item[0]}
				onclick={() => (capa = item[0] as typeof capa)}
			>
				{item[1]}
			</button>
		{/each}
	</div>

	{#if error}
		<div class="feedback feedback--error" role="alert">
			{error} <button type="button" onclick={cargar}>Reintentar</button>
		</div>
	{:else if cargando}
		<p class="muted" role="status">Cargando puntos cercanos…</p>
	{:else if visibles.length === 0}
		<p class="empty">Todavía no hay publicaciones en esta capa.</p>
	{:else}
		<ul class="map-list">
			{#each visibles as punto (punto.id)}
				<li class:selected={seleccionado?.id === punto.id}>
					<button type="button" class="map-list__button" onclick={() => seleccionar(punto)}>
						<span class="map-list__icon"
							>{punto.tipo === 'Alerta' ? '🚨' : punto.tipo === 'Favor' ? '🤝' : '🛠️'}</span
						>
						<span>
							<strong>{punto.titulo ?? punto.tipo}</strong>
							<small>{punto.tipo} · ubicación aproximada</small>
							{#if punto.descripcion}<span class="map-list__description">{punto.descripcion}</span
								>{/if}
						</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}

	{#if seleccionado}
		<div class="map-detail" role="dialog" aria-label="Detalle de publicación">
			<button
				class="map-detail__close"
				type="button"
				aria-label="Cerrar detalle"
				onclick={() => (seleccionado = null)}>×</button
			>
			<span class="eyebrow">{seleccionado.tipo}</span>
			<h2>{seleccionado.titulo ?? 'Publicación comunitaria'}</h2>
			{#if seleccionado.descripcion}<p>{seleccionado.descripcion}</p>{/if}
			<small>La ubicación exacta se comparte solo cuando es necesario.</small>
		</div>
	{/if}
</section>
