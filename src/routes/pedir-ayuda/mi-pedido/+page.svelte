<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	type Pedido = {
		id: string;
		necesidad: string;
		quienes: string[];
		cuantas: number;
		detalles?: string;
		estado: string;
		creadoEn: string;
	};
	const labels: Record<string, string> = {
		agua: 'Agua',
		comida: 'Comida',
		medicina: 'Medicinas',
		traslado: 'Traslado',
		resguardo: 'Resguardo',
		otra: 'Otra ayuda'
	};
	const icons: Record<string, string> = {
		agua: '💧',
		comida: '🍲',
		medicina: '💊',
		traslado: '🚗',
		resguardo: '🏠',
		otra: '🆘'
	};
	let pedido = $state<Pedido | null>(null);

	onMount(() => {
		const id = page.url.searchParams.get('id');
		try {
			const pedidos = JSON.parse(localStorage.getItem('ayni:v1:pedidos-ayuda') ?? '[]') as Pedido[];
			pedido = pedidos.find((item) => item.id === id) ?? pedidos[0] ?? null;
		} catch {
			pedido = null;
		}
	});
</script>

<svelte:head><title>Mi pedido de ayuda | AYNI</title></svelte:head>

<section class="app-screen emergency-request-page">
	<header class="mobile-header">
		<a class="mobile-header__back" href="/pedir-ayuda" aria-label="Volver a pedir ayuda">←</a>
		<strong>Mi pedido de ayuda</strong>
	</header>

	{#if pedido}
		<div class="help-request-card">
			<div class="help-request-card__icon">{icons[pedido.necesidad] ?? '🆘'}</div>
			<div>
				<strong>{labels[pedido.necesidad] ?? 'Ayuda comunitaria'}</strong>
				<span>{pedido.cuantas} persona(s) · zona aproximada</span>
			</div>
		</div>
		<div class="emergency-submitted">
			<div class="emergency-submitted__icon">⏳</div>
			<h1>Pedido guardado en este dispositivo</h1>
			<p>
				Todavía no hay un vecino asignado. Esta versión local no envía el pedido a una red de
				emergencia activa.
			</p>
			<small>Creado {new Date(pedido.creadoEn).toLocaleString('es')}</small>
		</div>
		{#if pedido.detalles}<p class="profile-card">
				<strong>Detalle:</strong>
				{pedido.detalles}
			</p>{/if}
		<a class="mobile-btn mobile-btn--danger" href="/grupos">Buscar apoyo disponible</a>
	{:else}
		<div class="empty">
			<h1>No encontramos tu pedido</h1>
			<p>Puede que se haya borrado del almacenamiento local.</p>
		</div>
	{/if}
</section>
