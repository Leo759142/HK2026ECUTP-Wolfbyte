<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'primary' | 'secondary';
		size?: 'sm' | 'md' | 'lg';
		class?: string;
		children: Snippet;
	}

	let { variant = 'primary', size = 'md', class: className = '', children }: Props = $props();

	const baseClasses = 'inline-flex items-center gap-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

	const variants = {
		primary: 'text-blue-600 hover:text-blue-700 focus:ring-blue-500',
		secondary: 'text-gray-600 hover:text-gray-900 focus:ring-gray-500'
	};

	const sizes = {
		sm: 'text-sm',
		md: 'text-base',
		lg: 'text-lg'
	};

	const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
</script>

<button class={classes} onclick={() => window.history.back()}>
	<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
	</svg>
	{@render children()}
</button>
