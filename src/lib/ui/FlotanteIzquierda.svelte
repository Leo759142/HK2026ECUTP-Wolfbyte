<script lang="ts">
	import AyudaComoFunciona from './AyudaComoFunciona.svelte';

	let abierta = $state(false);
</script>

<button
	type="button"
	aria-label="Abrir ayuda"
	onclick={() => (abierta = true)}
	class="fixed left-2 top-[45svh] z-50 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white bg-petroleo shadow-lg active:scale-[.95]"
>
	<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		<circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
	</svg>
</button>

{#if abierta}
	<AyudaComoFunciona open={true} onClose={() => (abierta = false)} />
{/if}
