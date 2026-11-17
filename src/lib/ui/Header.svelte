<script lang="ts">
	import { goto } from '$app/navigation';
	import { gestorIdiomas } from '../../i18n';
	import AyudaComoFunciona from './AyudaComoFunciona.svelte';

	let { title = '', back = true, onBack = undefined, children = undefined, mostrarAyuda = true } = $props();

	let ayudaAbierta = $state(false);

	function handleBack() {
		if (onBack) onBack();
		else goto('/');
	}
</script>

<div class="mobile-header">
	{#if back}
		<button
			class="mobile-header__back"
			type="button"
			aria-label="Volver"
			title="Volver"
			onclick={handleBack}
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
	{#if mostrarAyuda && !children}
		<button
			type="button"
			aria-label={gestorIdiomas.t('header.ayuda')}
			onclick={() => (ayudaAbierta = true)}
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-tinta bg-linea active:bg-linea/80"
		>
			<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
			</svg>
		</button>
	{/if}
</div>

{#if ayudaAbierta}
	<AyudaComoFunciona open={true} onClose={() => (ayudaAbierta = false)} />
{/if}
