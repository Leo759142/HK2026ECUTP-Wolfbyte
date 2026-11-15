<script lang="ts">
	import { onMount } from 'svelte';
	import Screen from '../../../lib/ui/Screen.svelte';
	import Header from '../../../lib/ui/Header.svelte';
	import { obtenerSesionLocal } from '../../../lib/onboarding';
	let items = $state<
		Array<{
			id?: string;
			titulo?: string;
			descripcion?: string;
			tipo?: string;
			foto?: string | null;
			estado?: string;
			categoria?: string;
			creado_en?: string;
		}>
	>([]);
	let imagenAmpliada = $state<string | null>(null);
	function leer<T>(key: string, fallback: T): T {
		try {
			const raw = localStorage.getItem(`ayni:v1:${key}`);
			return raw ? (JSON.parse(raw) as T) : fallback;
		} catch {
			return fallback;
		}
	}
	async function cargar() {
		const usuarioId = obtenerSesionLocal()?.usuarioId;
		const locales = [
			...leer<Array<Record<string, unknown>>>('services', []),
			...leer<Array<Record<string, unknown>>>('favors', [])
		].filter(
			(item) =>
				item.ownerId === usuarioId || item.usuario_id === usuarioId || item.creador_id === usuarioId
		);
		try {
			const [serviciosRespuesta, favoresRespuesta] = await Promise.all([
				fetch('/api/v1/servicios'),
				fetch('/api/v1/favores')
			]);
			const serviciosApi = serviciosRespuesta.ok
				? (((await serviciosRespuesta.json()) as { items?: Array<Record<string, unknown>> })
						.items ?? [])
				: [];
			const favoresApi = favoresRespuesta.ok
				? (((await favoresRespuesta.json()) as { items?: Array<Record<string, unknown>> }).items ??
					[])
				: [];
			const serviciosPropios = serviciosApi
				.filter((item) => item.usuario_id === usuarioId)
				.map((item) => ({ ...item, tipo: 'servicio' }));
			const favoresPropios = favoresApi
				.filter((item) => item.creador_id === usuarioId)
				.map((item) => ({ ...item, tipo: 'favor' }));
			const demoFallback =
				usuarioId === 'admin' && !serviciosPropios.length && !favoresPropios.length
					? [
							...serviciosApi.map((item) => ({ ...item, tipo: 'servicio' })),
							...favoresApi.map((item) => ({ ...item, tipo: 'favor' }))
						]
					: [];
			items = [...serviciosPropios, ...favoresPropios, ...demoFallback, ...locales] as typeof items;
		} catch {
			items = locales as typeof items;
		}
	}

	onMount(() => {
		void cargar();
	});
</script>

<Screen
	><Header title="Mis publicaciones" />
	<div class="publications-heading">
		<div>
			<h1>Mis publicaciones</h1>
			<p>
				{items.length
					? `${items.length} publicación${items.length === 1 ? '' : 'es'} activa${items.length === 1 ? '' : 's'}`
					: 'Comparte servicios y favores con tu comunidad.'}
			</p>
		</div>
		<a class="btn-publicar-compacto" href="/publicar">+ Publicar</a>
	</div>
	{#if !items.length}<div class="empty">Aún no tienes publicaciones activas.</div>{/if}
	<div class="publication-list">
		{#each items as item (item.id)}<article>
				<div class="publication-list__type">
					<span>{item.tipo === 'favor' ? '🤝' : '🛠️'}</span>
					<small>{item.tipo === 'favor' ? 'Favor' : 'Servicio'}</small>
				</div>
				{#if item.foto}
					<button
						class="publication-list__photo-button"
						type="button"
						aria-label="Ampliar imagen de la publicación"
						onclick={() => (imagenAmpliada = item.foto ?? null)}
					>
						<img class="publication-list__photo" src={item.foto} alt="" />
					</button>
				{/if}
				<div>
					<strong>{item.titulo ?? 'Publicación'}</strong>
					<p>{item.descripcion}</p>
					<small class="publication-list__meta"
						>{item.estado ?? 'Publicada'} · {item.categoria ?? 'Comunidad'}</small
					>
				</div>
			</article>{/each}
	</div>
</Screen>

{#if imagenAmpliada}
	<div
		class="image-lightbox"
		role="presentation"
		tabindex="-1"
		onclick={() => (imagenAmpliada = null)}
		onkeydown={(event) => {
			if (event.key === 'Escape') imagenAmpliada = null;
		}}
	>
		<div
			class="image-lightbox__content"
			role="dialog"
			aria-modal="true"
			aria-label="Imagen ampliada"
			tabindex="-1"
			onclick={(event) => event.stopPropagation()}
			onkeydown={(event) => event.stopPropagation()}
		>
			<button
				class="image-lightbox__close"
				type="button"
				aria-label="Cerrar imagen"
				onclick={() => (imagenAmpliada = null)}>×</button
			>
			<img src={imagenAmpliada} alt="Imagen ampliada de la publicación" />
		</div>
	</div>
{/if}
