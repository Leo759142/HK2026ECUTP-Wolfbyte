<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'default' | 'danger';
		class?: string;
		children: Snippet;
	}

	let { variant = 'default', class: className = '', children }: Props = $props();

	const variants = {
		default: 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50',
		danger: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
	};
</script>

<div class={`rounded-lg border p-4 ${variants[variant]} ${className}`}>
	{@render children()}
</div>
