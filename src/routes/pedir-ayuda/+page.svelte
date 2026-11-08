<script lang="ts">
	import { goto } from '$app/navigation';
	import PhotoPicker from '../../lib/ui/PhotoPicker.svelte';

	const necesidades = [
		['agua', '💧', 'Agua'],
		['comida', '🍲', 'Comida'],
		['medicina', '💊', 'Medicinas'],
		['traslado', '🚗', 'Traslado'],
		['resguardo', '🏠', 'Resguardo'],
		['otra', '🆘', 'Otra ayuda']
	] as const;
	const vulnerabilidades = [
		['menor', '👧', 'Hay menores'],
		['mayor', '🧓', 'Hay una persona mayor'],
		['discapacidad', '♿', 'Hay discapacidad'],
		['embarazo', '🤰', 'Hay embarazo']
	] as const;

	let necesidad = $state('');
	let quienes = $state<string[]>([]);
	let cuantas = $state(1);
	let detalles = $state('');
	let foto = $state<string | null>(null);
	let guardando = $state(false);
	let error = $state('');

	function alternarQuien(id: string) {
		quienes = quienes.includes(id) ? quienes.filter((item) => item !== id) : [...quienes, id];
	}

	async function pedir() {
		error = '';
		if (!necesidad) {
			error = 'Elige qué ayuda necesitas.';
			return;
		}
		guardando = true;
		try {
			const pedido = {
				id: crypto.randomUUID(),
				necesidad,
				quienes,
				cuantas,
				detalles: detalles.trim(),
				foto,
				estado: 'publicado',
				creadoEn: new Date().toISOString()
			};
			const actual = JSON.parse(localStorage.getItem('ayni:v1:pedidos-ayuda') ?? '[]') as unknown[];
			localStorage.setItem('ayni:v1:pedidos-ayuda', JSON.stringify([pedido, ...actual]));
			await goto(`/pedir-ayuda/mi-pedido?id=${encodeURIComponent(pedido.id)}`);
		} catch {
			error = 'No se pudo guardar el pedido en este dispositivo.';
		} finally {
			guardando = false;
		}
	}
</script>

<svelte:head><title>Pedir ayuda | AYNI</title></svelte:head>

<section class="app-screen emergency-request-page">
	<header class="mobile-header">
		<a class="mobile-header__back" href="/emergencia" aria-label="Volver a emergencias">←</a>
		<strong>Pedir ayuda</strong>
	</header>
	<div class="emergency-banner">
		<strong>🆘 Tu pedido será visible en tu dispositivo</strong>
		<span>AYNI todavía no tiene una emergencia activa conectada para asignar vecinos.</span>
	</div>
	<h1>¿Qué necesitas?</h1>
	<p class="muted">Describe lo esencial. Comparte solo la ubicación aproximada de tu sector.</p>

	<div class="emergency-type-grid" aria-label="Tipo de ayuda">
		{#each necesidades as [id, emoji, label]}
			<button class:active={necesidad === id} type="button" onclick={() => (necesidad = id)}>
				<span>{emoji}</span><strong>{label}</strong>
			</button>
		{/each}
	</div>

	<fieldset class="help-options">
		<legend>¿Quiénes están contigo?</legend>
		{#each vulnerabilidades as [id, emoji, label]}
			<label class:active={quienes.includes(id)}>
				<input type="checkbox" checked={quienes.includes(id)} onchange={() => alternarQuien(id)} />
				<span>{emoji}</span>{label}
			</label>
		{/each}
	</fieldset>

	<label class="publish-label">
		<span>¿Cuántas personas?</span>
		<input class="publish-input" type="number" min="1" max="20" bind:value={cuantas} />
	</label>
	<label class="publish-label">
		<span>Algo más que debamos saber (opcional)</span>
		<textarea
			class="publish-input publish-textarea"
			maxlength="160"
			bind:value={detalles}
			placeholder="Ej: Mi mamá usa silla de ruedas."></textarea>
	</label>
	<div class="publish-label">
		Foto opcional
		<PhotoPicker value={foto} onchange={(value) => (foto = value)} />
	</div>
	<p class="emergency-location">📍 Zona aproximada · tu manzana</p>
	{#if error}<p class="notice notice--error" role="alert">{error}</p>{/if}
	<button class="mobile-btn mobile-btn--danger" type="button" onclick={pedir} disabled={guardando}>
		{guardando ? 'Guardando pedido…' : 'Guardar pedido de ayuda'}
	</button>
	<a class="text-button text-center" href="/grupos">Ver grupos y servicios de apoyo</a>
</section>
