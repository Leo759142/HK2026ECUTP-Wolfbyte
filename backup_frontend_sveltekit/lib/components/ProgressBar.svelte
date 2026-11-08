<script lang="ts">
	interface Props {
		value: number;
		max?: number;
		size?: 'sm' | 'md' | 'lg';
		variant?: 'primary' | 'success' | 'warning' | 'danger';
	}

	let { value, max = 100, size = 'md', variant = 'primary' }: Props = $props();

	const percentage = $derived(Math.min(100, Math.max(0, (value / max) * 100)));

	const sizes = {
		sm: 'h-1',
		md: 'h-2',
		lg: 'h-3'
	};

	const variants = {
		primary: 'bg-blue-600',
		success: 'bg-green-600',
		warning: 'bg-yellow-600',
		danger: 'bg-red-600'
	};
</script>

<div class={`w-full rounded-full bg-gray-200 ${sizes[size]}`}>
	<div
		class={`${sizes[size]} rounded-full transition-all duration-300 ${variants[variant]}`}
		style="width: {percentage}%"
	></div>
</div>