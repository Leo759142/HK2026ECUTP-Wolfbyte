<script lang="ts">
	interface Props {
		data: { label: string; value: number }[];
		variant?: 'primary' | 'success' | 'warning' | 'danger';
	}

	let { data, variant = 'primary' }: Props = $props();

	const total = $derived(data.reduce((sum, item) => sum + item.value, 0));

	const variants = {
		primary: 'bg-blue-600',
		success: 'bg-green-600',
		warning: 'bg-yellow-600',
		danger: 'bg-red-600'
	};
</script>

<div class="space-y-2">
	{#each data as item (item.label)}
		<div class="flex items-center justify-between text-sm">
			<span class="text-gray-700">{item.label}</span>
			<span class="text-gray-500">
				{item.value} ({total > 0 ? Math.round((item.value / total) * 100) : 0}%)
			</span>
		</div>
		<div class="h-2 w-full rounded-full bg-gray-200">
			<div
				class="h-2 rounded-full transition-all duration-300 ${variants[variant]}"
				style="width: {total > 0 ? (item.value / total) * 100 : 0}%"
			></div>
		</div>
	{/each}
</div>