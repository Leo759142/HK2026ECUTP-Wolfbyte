<script lang="ts">
	let {
		variant = 'primario',
		type = 'button' as 'button' | 'submit' | 'reset',
		disabled = false,
		children,
		onclick,
		ariaLabel = undefined,
		ariaPressed = undefined,
		fullWidth = true
	} = $props();

	const variants: Record<string, string> = {
		primario: 'mobile-btn--primary',
		acento: 'mobile-btn--accent',
		rojo: 'mobile-btn--danger',
		borde: 'mobile-btn--outline',
		blanco: 'mobile-btn--white'
	};
</script>

<button
	class={`mobile-btn ${variants[variant] ?? variants.primario} ${fullWidth ? 'w-full' : ''}`}
	{type}
	{disabled}
	{onclick}
	aria-label={ariaLabel ?? undefined}
	aria-pressed={ariaPressed ?? undefined}
	style:min-height={fullWidth ? '64px' : '48px'}
	style:min-width={fullWidth ? 'auto' : '48px'}
>
	{@render children?.()}
</button>
