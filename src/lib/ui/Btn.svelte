<script lang="ts">
	import { gestorIdiomas } from '../../i18n';

	let {
		variant = 'primario',
		type = 'button' as 'button' | 'submit' | 'reset',
		disabled = false,
		children,
		onclick,
		ariaLabel = '',
		class: className = '',
		i18nKey = '',
		i18nFallback = ''
	} = $props();

	const variants: Record<string, string> = {
		primario: 'mobile-btn--primary',
		acento: 'mobile-btn--accent',
		rojo: 'mobile-btn--danger',
		borde: 'mobile-btn--outline',
		blanco: 'mobile-btn--white'
	};

	// Texto traducido reactivo: se recalcula cuando cambia gestorIdiomas.idiomaActual
	let textoTraducido = $derived(
		i18nKey ? gestorIdiomas.t(i18nKey) : i18nFallback ? gestorIdiomas.t(i18nFallback) : ''
	);
</script>

<button
	class={`mobile-btn ${variants[variant] ?? variants.primario} ${className}`.trim()}
	{type}
	{disabled}
	{onclick}
	aria-label={ariaLabel || textoTraducido || undefined}
	title={textoTraducido || undefined}
>
	{@render children?.()}
	{#if textoTraducido && !children}
		<span>{textoTraducido}</span>
	{/if}
</button>
