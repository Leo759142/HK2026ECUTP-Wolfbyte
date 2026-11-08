<script lang="ts">
	let {
		variant = 'primario',
		type = 'button' as 'button' | 'submit' | 'reset',
		disabled = false,
		children,
		onclick
	} = $props();

	const variants: Record<string, string> = {
		primario: 'mobile-btn--primary',
		acento: 'mobile-btn--accent',
		rojo: 'mobile-btn--danger',
		borde: 'mobile-btn--outline',
		blanco: 'mobile-btn--white'
	};
</script>

<button class={`mobile-btn ${variants[variant] ?? variants.primario}`} {type} {disabled} {onclick}>
	{@render children?.()}
</button>
