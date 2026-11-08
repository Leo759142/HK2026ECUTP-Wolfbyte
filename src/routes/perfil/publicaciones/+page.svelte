<script lang="ts">
	import Screen from '../../../lib/ui/Screen.svelte';
	import Header from '../../../lib/ui/Header.svelte';
	let items = $state<Array<{ id?: string; titulo?: string; descripcion?: string; tipo?: string }>>(
		[]
	);
	function leer<T>(key: string, fallback: T): T {
		try {
			const raw = localStorage.getItem(`ayni:v1:${key}`);
			return raw ? (JSON.parse(raw) as T) : fallback;
		} catch {
			return fallback;
		}
	}
	$effect(() => {
		const id = leer<Array<{ id?: string }>>('users', [])[0]?.id;
		const services = leer<Array<Record<string, unknown>>>('services', []).filter(
			(x) => x.ownerId === id || x.usuario_id === id
		);
		const favors = leer<Array<Record<string, unknown>>>('favors', []).filter(
			(x) => x.ownerId === id || x.creador_id === id
		);
		items = [...services, ...favors] as typeof items;
	});
</script>

<Screen
	><Header title="Mis publicaciones" />
	<h1>Mis publicaciones</h1>
	{#if !items.length}<div class="empty">Aún no tienes publicaciones activas.</div>{/if}
	<div class="publication-list">
		{#each items as item (item.id)}<article>
				<span>{item.tipo === 'favor' ? '🤝' : '🛠️'}</span>
				<div>
					<strong>{item.titulo ?? 'Publicación'}</strong>
					<p>{item.descripcion}</p>
				</div>
			</article>{/each}
	</div>
</Screen>
