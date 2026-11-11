<script lang="ts">
	import { onMount } from 'svelte';
	import type { Favor, RolEnFavor } from '../../dominio/tipos/tipos';
	import { ListarFavor, ConfirmarFavor } from '../../aplicacion/servicios';
	import { FavorRepoLocal, FavorConfirmacionRepoLocal } from '../../repositorios/favor.local';
	import { obtenerSesionLocal } from '../../lib/onboarding';
	import Header from '../../lib/ui/Header.svelte';
	import Screen from '../../lib/ui/Screen.svelte';

	const listarFavores = new ListarFavor(new FavorRepoLocal());
	const confirmarFavor = new ConfirmarFavor(new FavorConfirmacionRepoLocal());
	const favorRepo = new FavorRepoLocal();
	let items = $state<Favor[]>([]);
	let estado = $state<'cargando' | 'ok' | 'error'>('cargando');
	let filtro = $state<'todos' | 'necesidad' | 'oferta' | 'mios'>('todos');
	let query = $state('');
	let seleccionado = $state<any>(null);
	let aviso = $state('');
	let error = $state('');
	let enviando = $state<string | null>(null);
	let usuarioId = $state('demo');
	let confirmaciones = $state<Record<string, RolEnFavor[]>>({});

	let datos = $derived<any[]>(items);
	let visibles = $derived(
		datos.filter((item) => {
			const texto = `${item.titulo} ${item.descripcion}`.toLowerCase();
			const mio = item.creador_id === usuarioId || item.ayudante_id === usuarioId;
			return (
				(filtro === 'mios' ? mio : filtro === 'todos' || item.tipo === filtro) &&
				(!query || texto.includes(query.toLowerCase()))
			);
		})
	);

	async function cargar() {
		try {
			const respuesta = await fetch('/api/v1/favores');
			items = respuesta.ok
				? (((await respuesta.json()) as { items?: Favor[] }).items ?? [])
				: await listarFavores.ejecutar();
			const pares = await Promise.all(
				items.map(
					async (favor) =>
						[
							favor.id,
							(await new FavorConfirmacionRepoLocal().listarPorFavor(favor.id)).map(
								(confirmacion) => confirmacion.rol_en_favor
							)
						] as const
				)
			);
			confirmaciones = Object.fromEntries(pares);
			estado = 'ok';
		} catch {
			estado = 'error';
		}
	}

	async function seCumplio(favor: Favor, rol: RolEnFavor) {
		const usuario_id = rol === 'solicitante' ? favor.creador_id : favor.ayudante_id;
		if (!usuario_id) {
			error = 'Este favor todavía no tiene una persona asignada.';
			return;
		}
		if (confirmaciones[favor.id]?.includes(rol)) {
			aviso = 'Ya registraste la confirmación de este favor.';
			return;
		}
		enviando = `${favor.id}:${rol}`;
		aviso = '';
		error = '';
		try {
			await confirmarFavor.ejecutar({ favor_id: favor.id, usuario_id, rol_en_favor: rol });
			aviso = 'Confirmación registrada. Cuando ambas personas confirmen, el favor se cerrará.';
			seleccionado = null;
			await cargar();
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'No se pudo confirmar el favor.';
		} finally {
			enviando = null;
		}
	}

	async function reservar(favor: Favor) {
		if (favor.estado !== 'abierto' || favor.creador_id === usuarioId) return;
		enviando = `${favor.id}:reservar`;
		error = '';
		try {
			await favorRepo.actualizar(favor.id, { ayudante_id: usuarioId, estado: 'en_curso' });
			aviso = 'Favor reservado. Coordina con tu vecino y confirma cuando se cumpla.';
			seleccionado = null;
			await cargar();
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'No se pudo reservar el favor.';
		} finally {
			enviando = null;
		}
	}

	async function cancelar(favor: Favor) {
		if (favor.creador_id !== usuarioId || !['abierto', 'en_curso'].includes(favor.estado)) return;
		if (typeof window !== 'undefined' && !window.confirm('¿Cancelar esta publicación?')) return;
		enviando = `${favor.id}:cancelar`;
		try {
			await favorRepo.actualizar(favor.id, {
				estado: 'cancelado',
				cerrado_en: new Date().toISOString()
			});
			aviso = 'Publicación cancelada.';
			seleccionado = null;
			await cargar();
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'No se pudo cancelar la publicación.';
		} finally {
			enviando = null;
		}
	}

	function estadoTexto(favor: Favor) {
		return (
			{
				abierto: 'Abierto',
				en_curso: 'En curso',
				cerrado: 'Cerrado y confirmado',
				cancelado: 'Cancelado'
			}[favor.estado] ?? favor.estado
		);
	}

	onMount(() => {
		usuarioId = obtenerSesionLocal()?.usuarioId ?? 'demo';
		cargar();
	});
</script>

<svelte:head><title>Favores | AYNI</title></svelte:head>

<Screen class="favores-screen">
	<Header title="Cadena de favores" />
	<div class="favores-heading">
		<div>
			<h1>Hoy por ti, mañana por mí</h1>
			<p>Ayuda sin dinero, entre vecinos.</p>
		</div>
		<a class="favores-help" href="/publicar?tipo=favor">＋ Publicar</a>
	</div>
	<div class="favor-tabs" role="tablist">
		{#each [['todos', 'Todos'], ['necesidad', 'Necesitan ayuda'], ['oferta', 'Ofrecen ayuda'], ['mios', 'Mis publicaciones']] as item}
			<button
				class:active={filtro === item[0]}
				type="button"
				role="tab"
				aria-selected={filtro === item[0]}
				onclick={() => (filtro = item[0] as typeof filtro)}>{item[1]}</button
			>
		{/each}
	</div>
	<form class="app-search" role="search" onsubmit={(event) => event.preventDefault()}>
		<span aria-hidden="true">⌕</span>
		<input aria-label="Buscar favor" placeholder="Buscar favor" bind:value={query} />
	</form>
	{#if aviso}<p class="notice notice--ok" role="status">{aviso}</p>{/if}
	{#if error}<p class="notice notice--error" role="alert">{error}</p>{/if}
	{#if estado === 'cargando'}<p class="muted" role="status">Cargando favores…</p>{/if}
	<div class="favor-list responsive-list">
		{#each visibles as favor (favor.id)}
			<button class="favor-card" type="button" onclick={() => (seleccionado = favor)}>
				<div class:favor-icon--offer={favor.tipo === 'oferta'} class="favor-icon">
					{favor.tipo === 'oferta' ? '🎁' : '🤝'}
				</div>
				<div class="favor-card__body">
					<div class="favor-card__title">
						<strong>{favor.titulo}</strong><span
							>{favor.tipo === 'oferta' ? 'Ofrece' : 'Necesita'}</span
						>
					</div>
					<p>{favor.descripcion}</p>
					<small>📍 En tu zona · {estadoTexto(favor)}</small>
				</div>
			</button>
		{/each}
		{#if visibles.length === 0}<p class="empty">No hay favores con este filtro.</p>{/if}
	</div>
</Screen>

{#if seleccionado}
	<div class="detail-overlay" role="presentation" onclick={() => (seleccionado = null)}>
		<div
			class="detail-sheet favor-detail"
			role="dialog"
			aria-modal="true"
			aria-label="Detalle del favor"
			tabindex="-1"
			onclick={(event) => event.stopPropagation()}
			onkeydown={(event) => event.stopPropagation()}
		>
			<button
				class="detail-close"
				type="button"
				aria-label="Cerrar"
				onclick={() => (seleccionado = null)}>×</button
			>
			<div
				class:favor-icon--offer={seleccionado.tipo === 'oferta'}
				class="favor-icon favor-icon--large"
			>
				{seleccionado.tipo === 'oferta' ? '🎁' : '🤝'}
			</div>
			<span class="favor-kind"
				>{seleccionado.tipo === 'oferta' ? 'Oferta de ayuda' : 'Necesita ayuda'}</span
			>
			<h2>{seleccionado.titulo}</h2>
			<p>{seleccionado.descripcion}</p>
			<div class="detail-tags">
				<span>📍 Ubicación aproximada</span><span>Estado: {estadoTexto(seleccionado)}</span>
			</div>
			{#if seleccionado.estado === 'abierto' && seleccionado.creador_id !== usuarioId}
				<button
					class="mobile-btn mobile-btn--accent"
					disabled={enviando !== null}
					onclick={() => reservar(seleccionado)}>🙋 Ofrecer ayuda</button
				>
			{:else if seleccionado.estado === 'en_curso' && seleccionado.ayudante_id}
				<div class="favor-confirm-actions">
					{#if seleccionado.creador_id === usuarioId && !confirmaciones[seleccionado.id]?.includes('solicitante')}
						<button
							class="mobile-btn mobile-btn--primary"
							disabled={enviando !== null}
							onclick={() => seCumplio(seleccionado, 'solicitante')}>Se cumplió</button
						>
					{:else if seleccionado.ayudante_id === usuarioId && !confirmaciones[seleccionado.id]?.includes('ayudante')}
						<button
							class="mobile-btn mobile-btn--primary"
							disabled={enviando !== null}
							onclick={() => seCumplio(seleccionado, 'ayudante')}>Se cumplió</button
						>
					{/if}
				</div>
				{#if seleccionado.creador_id === usuarioId}
					<button
						class="mobile-btn mobile-btn--outline"
						disabled={enviando !== null}
						onclick={() => cancelar(seleccionado)}>Cancelar favor</button
					>
				{/if}
				{#if seleccionado.creador_id !== usuarioId && seleccionado.ayudante_id !== usuarioId}
					<p class="muted">Este favor ya está coordinado con otro vecino.</p>
				{/if}
			{:else if seleccionado.estado === 'cerrado'}
				<p class="notice notice--ok">Este favor ya fue cerrado y confirmado.</p>
			{:else if seleccionado.estado === 'cancelado'}
				<p class="notice">Esta publicación fue cancelada.</p>
			{:else if seleccionado.creador_id === usuarioId}
				<button
					class="mobile-btn mobile-btn--outline"
					disabled={enviando !== null}
					onclick={() => cancelar(seleccionado)}>Cancelar publicación</button
				>
			{/if}
			{#if seleccionado.creador_id !== usuarioId}
				<div class="detail-moderation">
					<a
						href={`/moderacion/reportar?collection=favors&id=${encodeURIComponent(seleccionado.id)}`}
						>⚑ Reportar publicación</a
					>
					<button
						type="button"
						onclick={() => {
							const actual = JSON.parse(
								localStorage.getItem('ayni:v1:blocked') ?? '[]'
							) as string[];
							if (!actual.includes(seleccionado.creador_id)) actual.push(seleccionado.creador_id);
							localStorage.setItem('ayni:v1:blocked', JSON.stringify(actual));
						}}>🚫 Bloquear vecino</button
					>
				</div>
			{/if}
		</div>
	</div>
{/if}
