<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'primary' | 'secondary' | 'ghost';
		class?: string;
		children: Snippet;
	}

	let { variant = 'primary', class: className = '', children }: Props = $props();

	const variants = {
		primary: 'bg-blue-600 text-white',
		secondary: 'bg-gray-200 text-gray-900',
		ghost: 'bg-transparent text-gray-700'
	};
</script>

<div class={`inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium ${variants[variant]} ${className}`}>
	{@render children()}
</div>