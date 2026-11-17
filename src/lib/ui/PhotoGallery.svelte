<script lang="ts">
	interface Props {
		foto?: string | null;
		fotos?: string[];
		alt?: string;
	}

	let { foto = null, fotos = [], alt = 'Imagen publicada' }: Props = $props();
	let ampliada = $state<string | null>(null);
	let imagenes = $derived([...(foto ? [foto] : []), ...fotos.filter((item) => item !== foto)].slice(0, 3));
</script>

<style>
	.photo-gallery {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.photo-gallery__thumb {
		width: 88px;
		height: 88px;
		flex: 0 0 88px;
		border: 0;
		border-radius: 14px;
		padding: 0;
		overflow: hidden;
		background: #eae3d6;
		cursor: zoom-in;
	}
	.photo-gallery__thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
		display: block;
	}
</style>

{#if imagenes.length}
	<div class="photo-gallery" aria-label="Fotos de la publicación">
		{#each imagenes as imagen, index}
			<button
				class="photo-gallery__thumb"
				type="button"
				aria-label={`Ampliar imagen ${index + 1}`}
				onclick={() => (ampliada = imagen)}
			>
				<img src={imagen} alt={`${alt} ${index + 1}`} />
			</button>
		{/each}
	</div>
{/if}

{#if ampliada}
	<div
		class="image-lightbox"
		role="presentation"
		tabindex="-1"
		onclick={() => (ampliada = null)}
		onkeydown={(event) => {
			if (event.key === 'Escape') ampliada = null;
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
			<button class="image-lightbox__close" type="button" aria-label="Cerrar imagen" onclick={() => (ampliada = null)}>×</button>
			<img src={ampliada} alt={`${alt} ampliada`} />
		</div>
	</div>
{/if}
