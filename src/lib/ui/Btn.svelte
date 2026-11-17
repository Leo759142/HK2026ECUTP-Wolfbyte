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

	// Valor reactivo del texto traducido
	let textoTraducido = $state('');

	function actualizarTexto(): void {
		if (i18nKey) {
			textoTraducido = gestorIdiomas.t(i18nKey);
		} else if (i18nFallback) {
			textoTraducido = gestorIdiomas.t(i18nFallback);
		} else {
			textoTraducido = '';
		}
	}

	// Inicializar valor
	actualizarTexto();

	// Reaccionar a cambios de idioma
	$effect(() => {
		const _idioma = gestorIdiomas.idiomaActual;
		void _idioma;
		actualizarTexto();
	});
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
