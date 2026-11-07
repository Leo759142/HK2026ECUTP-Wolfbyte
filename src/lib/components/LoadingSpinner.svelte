<script lang="ts">
	interface Props {
		size?: 'sm' | 'md' | 'lg';
	}

	let { size = 'md' }: Props = $props();

	const sizes = {
		sm: 'h-8 w-8',
		md: 'h-12 w-12',
		lg: 'h-16 w-16'
	};
</script>

<div class="flex items-center justify-center">
	<svg
		class={`${sizes[size]} animate-spin text-blue-600`}
		fill="none"
		viewBox="0 0 24 24"
	>
		<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
		<path
			class="opacity-75"
			d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
			fill="currentColor"
		></path>
	</svg>
</div>