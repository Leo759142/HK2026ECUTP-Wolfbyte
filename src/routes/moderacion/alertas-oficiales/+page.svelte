<script lang="ts">
	import { onMount } from 'svelte';
	import Screen from '../../../lib/ui/Screen.svelte';
	import Header from '../../../lib/ui/Header.svelte';
	import Icono from '../../../lib/iconos/Icono.svelte';

	type AlertaOficial = {
		id: string;
		fuente: string;
		nivel: string;
		titulo: string;
		descripcion: string;
		estado: 'propuesta' | 'confirmada' | 'descartada';
	};

	let items = $state<AlertaOficial[]>([]);
	let error = $state('');
	let cargando = $state(true);

	async function cargar() {
		cargando = true;
		error = '';
		try {
			const response = await fetch('/api/v1/alertas-oficiales');
			if (!response.ok) throw new Error('No se pudieron cargar las alertas oficiales.');
			items = ((await response.json()) as { items?: AlertaOficial[] }).items ?? [];
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'No se pudieron cargar las alertas.';
		} finally {
			cargando = false;
		}
	}

	async function revisar(id: string, estado: 'confirmada' | 'descartada') {
		const response = await fetch(`/api/v1/alertas-oficiales/${encodeURIComponent(id)}`, {
			method: 'PATCH',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ estado })
		});
		if (!response.ok) {
			error = 'No se pudo actualizar la alerta. Verifica tu rol de coordinador.';
			return;
		}
		await cargar();
	}

	onMount(cargar);
</script>

<svelte:head><title>Alertas oficiales | AYNI</title></svelte:head>

<Screen>
	<Header title="Alertas oficiales" />
	<div class="section-heading">
		<div>
			<h1>Revisión de fuentes oficiales</h1>
			<p>Confirma solo información verificable para tu comunidad.</p>
		</div>
		<button class="text-button" type="button" onclick={cargar} disabled={cargando}
			>Actualizar</button
		>
	</div>
	{#if error}<p class="notice notice--error" role="alert">{error}</p>{/if}
	{#if cargando}<p class="muted" role="status">Cargando alertas…</p>{/if}
	<div class="emergency-list">
		{#each items as item (item.id)}
			<article class="emergency-card">
				<div class="emergency-card__icon"><Icono name="radar" /></div>
				<div>
					<strong>{item.titulo}</strong>
					<small>{item.fuente} · Nivel {item.nivel} · {item.estado}</small>
					<p>{item.descripcion}</p>
					{#if item.estado === 'propuesta'}
						<div class="flex gap-2">
							<button
								class="mobile-btn mobile-btn--primary"
								type="button"
								onclick={() => revisar(item.id, 'confirmada')}>Confirmar</button
							>
							<button
								class="mobile-btn mobile-btn--outline"
								type="button"
								onclick={() => revisar(item.id, 'descartada')}>Descartar</button
							>
						</div>
					{/if}
				</div>
			</article>
		{/each}
		{#if !cargando && items.length === 0}
			<p class="empty">No hay alertas oficiales pendientes.</p>
		{/if}
	</div>
</Screen>
