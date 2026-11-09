<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import type { Servicio } from '../../dominio/tipos/tipos';
	import { ListarServicios } from '../../aplicacion/servicios';
	import { ServicioRepoLocal } from '../../repositorios/servicio.local';
	import Header from '../../lib/ui/Header.svelte';
	import Screen from '../../lib/ui/Screen.svelte';

	type Recomendacion = {
		id: string;
		servicio_id: string;
		usuario_id?: string;
		tipo: string;
		comentario?: string | null;
		misma_zona?: boolean | number;
		creado_en?: string;
	};
	type PerfilLocal = {
		id?: string;
		firstName?: string;
		alias?: string;
		phone?: string;
		telefono?: string;
	};
	type ServicioVista = Servicio & {
		owner?: string;
		ownerId?: string;
		telefono?: string;
		distancia?: number;
		votos?: number;
		horario?: string;
	};

	const listarServicios = new ListarServicios(new ServicioRepoLocal());
	const categorias = [
		['todos', '✨', 'Todos'],
		['gasfiteria', '🔧', 'Gasfitería'],
		['electricidad', '⚡', 'Electricidad'],
		['carpinteria', '🪚', 'Carpintería'],
		['costura', '🧵', 'Costura'],
		['clases', '📚', 'Clases'],
		['comida', '🍲', 'Comida']
	];
	let items = $state<ServicioVista[]>([]);
	let perfiles = $state<PerfilLocal[]>([]);
	let recomendaciones = $state<Recomendacion[]>([]);
	let estado = $state<'cargando' | 'ok' | 'error'>('cargando');
	let query = $state('');
	let categoria = $state(page.url.searchParams.get('categoria') ?? 'todos');
	let orden = $state<'recomendados' | 'cerca' | 'vistos'>('recomendados');
	let seleccionado = $state<ServicioVista | null>(null);
	let mostrarVistoBueno = $state(false);
	let comentario = $state('');
	let contactoRealizado = $state(false);
	let mensaje = $state('');
	let error = $state('');
	let usuarioId = $state('u4');

	let datos = $derived<ServicioVista[]>(items);
	let visibles = $derived<ServicioVista[]>(
		[...datos]
			.map((item) => {
				const perfil = perfiles.find((p) => p.id === item.usuario_id);
				const propios = recomendaciones.filter(
					(r) => r.servicio_id === item.id && r.tipo === 'visto_bueno'
				);
				return {
					...item,
					owner: item.owner ?? perfil?.firstName ?? perfil?.alias ?? 'Vecino',
					telefono: item.telefono ?? perfil?.phone ?? perfil?.telefono,
					votos: item.votos ?? propios.length,
					distancia: item.distancia ?? 2,
					horario: item.horario ?? 'Consulta disponibilidad'
				};
			})
			.filter((item) => {
				const texto = `${item.titulo} ${item.descripcion} ${item.owner ?? ''}`.toLowerCase();
				return (
					(!query || texto.includes(query.toLowerCase())) &&
					(categoria === 'todos' || item.categoria === categoria)
				);
			})
			.sort((a, b) =>
				orden === 'cerca'
					? (a.distancia ?? 9) - (b.distancia ?? 9)
					: (b.votos ?? 0) - (a.votos ?? 0)
			)
	);
	let recomendacionesServicio = $derived(
		seleccionado
			? recomendaciones.filter(
					(r) => r.servicio_id === seleccionado?.id && r.tipo === 'visto_bueno'
				)
			: []
	);
	let yaRecomendo = $derived(
		seleccionado ? recomendacionesServicio.some((r) => r.usuario_id === usuarioId) : false
	);

	function icono(id: string) {
		return categorias.find((item) => item[0] === id)?.[1] ?? '🛠️';
	}

	async function cargarRecomendaciones(id?: string) {
		if (!id) return;
		try {
			const respuesta = await fetch(`/api/v1/servicios/${encodeURIComponent(id)}/recomendaciones`);
			if (respuesta.ok) {
				const cuerpo = (await respuesta.json()) as { items?: Recomendacion[] };
				recomendaciones = [
					...recomendaciones.filter((r) => r.servicio_id !== id),
					...(cuerpo.items ?? [])
				];
			}
		} catch {
			// El modo local conserva la experiencia aunque la API no esté disponible.
		}
	}

	function abrirDetalle(servicio: ServicioVista) {
		seleccionado = servicio;
		mostrarVistoBueno = false;
		mensaje = '';
		error = '';
		const contactos = JSON.parse(localStorage.getItem('ayni:v1:contacts') ?? '[]') as string[];
		contactoRealizado = contactos.includes(servicio.id);
		void cargarRecomendaciones(servicio.id);
	}

	function contactar() {
		if (!seleccionado) return;
		const contactos = JSON.parse(localStorage.getItem('ayni:v1:contacts') ?? '[]') as string[];
		if (!contactos.includes(seleccionado.id)) contactos.push(seleccionado.id);
		localStorage.setItem('ayni:v1:contacts', JSON.stringify(contactos));
		contactoRealizado = true;
		const telefono = seleccionado.telefono?.replace(/[^\d+]/g, '');
		const texto = encodeURIComponent(
			`Hola ${seleccionado.owner ?? 'vecino'}, te vi en AYNI. Me interesa: ${seleccionado.titulo}.`
		);
		if (telefono)
			window.open(`https://wa.me/${telefono.replace('+', '')}?text=${texto}`, '_blank', 'noopener');
		else mensaje = 'Contacto registrado. El teléfono de este perfil no está disponible todavía.';
	}

	async function enviarVistoBueno() {
		if (!seleccionado || !comentario.trim() || yaRecomendo) return;
		error = '';
		const idempotencia = crypto.randomUUID();
		try {
			const respuesta = await fetch(
				`/api/v1/servicios/${encodeURIComponent(seleccionado.id)}/recomendaciones`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencia },
					body: JSON.stringify({
						tipo: 'visto_bueno',
						misma_zona: true,
						dispositivo_hash: 'ayni-web-local',
						comentario: comentario.trim(),
						usuario_id: usuarioId
					})
				}
			);
			if (!respuesta.ok) throw new Error('No se pudo guardar tu Visto Bueno.');
			mensaje = '¡Gracias! Tu Visto Bueno ayuda a tus vecinos.';
			comentario = '';
			mostrarVistoBueno = false;
			await cargarRecomendaciones(seleccionado.id);
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'No se pudo guardar tu recomendación.';
		}
	}

	onMount(async () => {
		try {
			const sesion = localStorage.getItem('ayni:v1:session');
			if (sesion) usuarioId = (JSON.parse(sesion) as { usuarioId?: string }).usuarioId ?? usuarioId;
			perfiles = JSON.parse(localStorage.getItem('ayni:v1:users') ?? '[]') as PerfilLocal[];
			const respuesta = await fetch('/api/v1/servicios');
			if (respuesta.ok) {
				items = ((await respuesta.json()) as { items?: ServicioVista[] }).items ?? [];
			} else {
				items = (await listarServicios.ejecutar()) as ServicioVista[];
			}
			estado = 'ok';
		} catch {
			estado = 'error';
		}
	});
</script>

<svelte:head><title>Servicios | AYNI</title></svelte:head>

<Screen class="services-screen">
	<Header title="Servicios del barrio" />
	<div class="services-heading">
		<div>
			<h1>Encuentra ayuda cerca</h1>
			<p>Recomendados por tus vecinos.</p>
		</div>
		<a class="services-map-link" href="/mapa">🗺️ Mapa</a>
	</div>
	<form class="app-search" role="search" onsubmit={(event) => event.preventDefault()}>
		<span aria-hidden="true">⌕</span>
		<input aria-label="Buscar servicio" placeholder="¿Qué necesitas hoy?" bind:value={query} />
	</form>
	<div class="service-categories" aria-label="Categorías">
		{#each categorias as [id, emoji, label]}
			<button class:active={categoria === id} type="button" onclick={() => (categoria = id)}
				><span>{emoji}</span>{label}</button
			>
		{/each}
	</div>
	<div class="service-sort" role="tablist">
		{#each [['recomendados', 'Recomendados'], ['cerca', 'Más cerca'], ['vistos', 'Más vistos']] as item}
			<button
				class:active={orden === item[0]}
				type="button"
				role="tab"
				aria-selected={orden === item[0]}
				onclick={() => (orden = item[0] as typeof orden)}>{item[1]}</button
			>
		{/each}
	</div>
	{#if estado === 'cargando'}<p class="muted" role="status">Cargando servicios…</p>{/if}
	{#if estado === 'error'}<p class="notice notice--error">
			Mostrando servicios guardados en el dispositivo.
		</p>{/if}
	{#if mensaje}<p class="notice notice--ok" role="status">{mensaje}</p>{/if}
	<div class="service-list">
		{#each visibles as servicio (servicio.id)}
			<button class="service-result" type="button" onclick={() => abrirDetalle(servicio)}>
				<div class="service-result__image">
					{#if servicio.foto}<img src={servicio.foto} alt="" />{:else}<span
							>{icono(servicio.categoria)}</span
						>{/if}
				</div>
				<div class="service-result__body">
					<strong>{servicio.owner} · {servicio.titulo}</strong>
					<small>📍 A {servicio.distancia} cuadras · {servicio.horario}</small>
					<span class="service-rating"
						>👍 {servicio.votos} · {servicio.votos
							? 'Recomendado por vecinos'
							: 'Nuevo en AYNI'}</span
					>
				</div>
			</button>
		{/each}
		{#if visibles.length === 0}<p class="empty">No encontramos servicios con esos filtros.</p>{/if}
	</div>
	<a class="publish-prompt" href="/publicar?tipo=servicio"
		><span aria-hidden="true">🛠️</span><span
			><strong>¿Tienes un oficio?</strong><small>Ofrécelo a tus vecinos en 3 clics.</small></span
		></a
	>
</Screen>

{#if seleccionado}
	<div class="detail-overlay" role="presentation" onclick={() => (seleccionado = null)}>
		<div
			class="detail-sheet"
			role="dialog"
			aria-modal="true"
			aria-label="Detalle del servicio"
			onclick={(event) => event.stopPropagation()}
			onkeydown={(event) => event.stopPropagation()}
			tabindex="-1"
		>
			<button
				class="detail-close"
				type="button"
				aria-label="Cerrar"
				onclick={() => (seleccionado = null)}>×</button
			>
			<div class="detail-icon">
				{#if seleccionado.foto}<img src={seleccionado.foto} alt="" />{:else}{icono(
						seleccionado.categoria
					)}{/if}
			</div>
			<h2>{seleccionado.owner} · {seleccionado.titulo}</h2>
			<p>{seleccionado.descripcion}</p>
			<div class="detail-tags">
				<span>👍 {recomendacionesServicio.length || seleccionado.votos || 0} vistos buenos</span
				><span>📍 A {seleccionado.distancia} cuadras</span><span>🕒 {seleccionado.horario}</span>
			</div>
			{#if recomendacionesServicio.length}
				<section class="detail-reviews">
					<h3>Lo que dicen tus vecinos</h3>
					{#each recomendacionesServicio.slice(0, 3) as recomendacion}<blockquote>
							“{recomendacion.comentario || 'Servicio recomendado por un vecino.'}”
						</blockquote>{/each}
				</section>
			{/if}
			{#if error}<p class="notice notice--error">{error}</p>{/if}
			{#if mensaje}<p class="notice notice--ok">{mensaje}</p>{/if}
			{#if mostrarVistoBueno}
				<label class="review-field"
					>Cuéntales a tus vecinos (opcional)
					<textarea
						maxlength="140"
						bind:value={comentario}
						placeholder="Ej: Llegó rápido y cobró lo justo."></textarea>
				</label>
				<button
					class="mobile-btn mobile-btn--primary"
					type="button"
					disabled={!comentario.trim()}
					onclick={enviarVistoBueno}>👍 Dar mi Visto Bueno</button
				>
				<button class="detail-secondary" type="button" onclick={() => (mostrarVistoBueno = false)}
					>Cancelar</button
				>
			{:else}
				<button class="mobile-btn mobile-btn--primary" type="button" onclick={contactar}
					>💬 Escribir por WhatsApp</button
				>
				<button
					class="detail-secondary"
					type="button"
					disabled={yaRecomendo}
					onclick={() => (mostrarVistoBueno = true)}
					>{yaRecomendo
						? '💜 Ya lo recomendaste'
						: contactoRealizado
							? '👍 Dar mi Visto Bueno'
							: '👍 Recomendar después de contactar'}</button
				>
				{#if !contactoRealizado}<small class="detail-hint"
						>Primero contacta al vecino para contar tu experiencia.</small
					>{/if}
				<div class="detail-moderation">
					<a
						href={`/moderacion/reportar?collection=services&id=${encodeURIComponent(seleccionado.id)}`}
						>⚑ Reportar publicación</a
					>
					<button
						type="button"
						onclick={() => {
							const actual = JSON.parse(
								localStorage.getItem('ayni:v1:blocked') ?? '[]'
							) as string[];
							if (!actual.includes(seleccionado?.usuario_id ?? seleccionado?.owner ?? ''))
								actual.push(seleccionado?.usuario_id ?? seleccionado?.owner ?? '');
							localStorage.setItem('ayni:v1:blocked', JSON.stringify(actual));
							mensaje = 'Vecino bloqueado en este dispositivo.';
						}}>🚫 Bloquear vecino</button
					>
				</div>
			{/if}
		</div>
	</div>
{/if}
