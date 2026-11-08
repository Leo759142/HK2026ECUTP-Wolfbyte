<script lang="ts">
	import { goto } from '$app/navigation';

	let { title = '', back = true, children = undefined } = $props();
</script>

<div class="mobile-header">
	{#if back}
		<button
			class="mobile-header__back"
			type="button"
			aria-label="Volver"
			title="Volver"
			onclick={() => goto('/')}
		>
			<svg
				viewBox="0 0 24 24"
				width="25"
				height="25"
				fill="none"
				stroke="currentColor"
				stroke-width="2.8"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
			</svg>
		</button>
	{/if}
	<strong>{title}</strong>
	<div class="mobile-header__right">{@render children?.()}</div>
</div>
