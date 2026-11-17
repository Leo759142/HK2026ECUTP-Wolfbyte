<script lang="ts">
	import Icono from '../iconos/Icono.svelte';
	let {
		pasoActual = 1,
		totalPasos = 1,
		onBack,
		onNext,
		nextLabel = 'Siguiente',
		backLabel = 'Atrás',
		nextDisabled = false
	} = $props();
</script>

<nav class="step-nav" aria-label="Navegación de pasos">
	<button
		type="button"
		class="step-nav__btn step-nav__btn--back"
		onclick={onBack}
		disabled={!onBack}
		aria-label={backLabel}
	>
		<Icono name="volver" /> {backLabel}
	</button>
	<span class="step-nav__indicator" aria-live="polite">{pasoActual} de {totalPasos}</span>
	<button
		type="button"
		class="step-nav__btn step-nav__btn--next"
		onclick={onNext}
		disabled={nextDisabled || !onNext}
		aria-label={nextLabel}
	>
		{nextLabel} <span class="step-nav__flip"><Icono name="volver" /></span>
	</button>
</nav>

<style>
	.step-nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		width: 100%;
		margin-top: auto;
	}
	.step-nav__btn {
		min-height: 48px;
		min-width: 96px;
		border: 2px solid #eae3d6;
		border-radius: 14px;
		background: white;
		color: #143d48;
		font-size: 0.85rem;
		font-weight: 900;
		cursor: pointer;
		padding: 0 12px;
		transition: background 120ms ease;
	}
	.step-nav__btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.step-nav__btn--next {
		background: #0f4c5c;
		color: white;
		border-color: #0f4c5c;
	}
	.step-nav__btn:focus-visible {
		outline: 3px solid #7b2cbf;
		outline-offset: 2px;
	}
	.step-nav__flip {
		display: inline-block;
		transform: rotate(180deg);
	}
</style>
