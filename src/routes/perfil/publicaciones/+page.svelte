<script lang="ts">
	import { onMount } from 'svelte';
	import Screen from '../../../lib/ui/Screen.svelte';
	import Header from '../../../lib/ui/Header.svelte';
	import { obtenerSesionLocal } from '../../../lib/onboarding';
	import { dao } from '../../../datos/dao';
	import Icono from '../../../lib/iconos/Icono.svelte';

	type Publicacion = {
		id?: string;
		titulo?: string;
		descripcion?: string;
		tipo?: string;
		foto?: string | null;
		estado?: string;
		categoria?: string;
		creado_en?: string;
		usuario_id?: string;
		creador_id?: string;
		ownerId?: string;
	};

	let items = $state<Publicacion[]>([]);
	let imagenAmpliada = $state<string | null>(null);

	function leer<T>(key: string, fallback: T): T {
		try {
			const raw = localStorage.getItem(`ayni:v1:${key}`);
			return raw ? (JSON.parse(raw) as T) : fallback;
		} catch {
			return fallback;
		}
	}

	const esPropia = (item: Record<string, unknown>, usuarioId?: string) =>
		!usuarioId ||
		item.usuario_id === usuarioId ||
		item.creador_id === usuarioId ||
		item.ownerId === usuarioId;

	const conTipo = (rows: Array<Record<string, unknown>>, tipo: string): Publicacion[] =>
		rows.map((row) => ({ ...row, tipo }) as Publicacion);

	function fusionar(listas: Publicacion[][]): Publicacion[] {
		const mapa = new Map<string, Publicacion>();
		for (const lista of listas) {
			for (const item of lista) {
				if (!item.id) continue;
				const id = String(item.id);
				const previo = mapa.get(id);
				mapa.set(id, previo ? { ...previo, ...item } : item);
			}
		}
		return [...mapa.values()].sort((a, b) =>
			(b.creado_en ?? '').localeCompare(a.creado_en ?? '')
		);
	}

	async function cargar() {
		const usuarioId = obtenerSesionLocal()?.usuarioId;

		const locales = [
			...conTipo(await dao.listarLocal<Record<string, unknown>>('servicios'), 'servicio'),
			...conTipo(await dao.listarLocal<Record<string, unknown>>('favores'), 'favor'),
			...conTipo(await dao.listarLocal<Record<string, unknown>>('alertas'), 'alerta')
		].filter((item) => esPropia(item as Record<string, unknown>, usuarioId));

		const legacy = [
			...conTipo(leer<Array<Record<string, unknown>>>('services', []), 'servicio'),
			...conTipo(leer<Array<Record<string, unknown>>>('favors', []), 'favor')
		].filter((item) => esPropia(item as Record<string, unknown>, usuarioId));

		let remotas: Publicacion[] = [];
		try {
			const [serviciosRespuesta, favoresRespuesta, alertasRespuesta] = await Promise.all([
				fetch('/api/v1/servicios'),
				fetch('/api/v1/favores'),
				fetch('/api/v1/alertas')
			]);
			const serviciosApi = serviciosRespuesta.ok
				? (((await serviciosRespuesta.json()) as { items?: Array<Record<string, unknown>> })
						.items ?? [])
				: [];
			const favoresApi = favoresRespuesta.ok
				? (((await favoresRespuesta.json()) as { items?: Array<Record<string, unknown>> }).items ??
					[])
				: [];
			const alertasApi = alertasRespuesta.ok
				? (((await alertasRespuesta.json()) as { items?: Array<Record<string, unknown>> }).items ??
					[])
				: [];
			remotas = [
				...conTipo(serviciosApi, 'servicio'),
				...conTipo(favoresApi, 'favor'),
				...conTipo(alertasApi, 'alerta')
			].filter((item) => esPropia(item as Record<string, unknown>, usuarioId));
		} catch {
			remotas = [];
		}

		items = fusionar([locales, legacy, remotas]);
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
		<a class="btn-publicar-compacto" href="/publicar"><Icono name="agregar" /> Publicar</a>
	</div>
	{#if !items.length}<div class="empty">Aún no tienes publicaciones activas.</div>{/if}
	<div class="publication-list">
			{#each items as item (item.id)}<article>
				<div class="publication-list__type">
					<span
						><Icono
							name={item.tipo === 'favor'
								? 'favores'
								: item.tipo === 'alerta'
									? 'alerta'
									: 'servicio'}
						/></span
					>
					<small
						>{item.tipo === 'favor' ? 'Favor' : item.tipo === 'alerta' ? 'Alerta' : 'Servicio'}</small
					>
				</div>
				<div class="publication-list__thumb">
					{#if item.foto}
						<button
							class="publication-list__photo-button"
							type="button"
							aria-label="Ampliar imagen de la publicación"
							onclick={() => (imagenAmpliada = item.foto ?? null)}
						>
							<img class="publication-list__photo" src={item.foto} alt="" />
						</button>
					{:else}
						<div class="publication-list__placeholder" aria-hidden="true">
							<Icono
								name={item.tipo === 'favor'
									? 'favores'
									: item.tipo === 'alerta'
										? 'alerta'
										: 'servicio'}
							/>
						</div>
					{/if}
				</div>
				<div class="publication-list__body">
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
