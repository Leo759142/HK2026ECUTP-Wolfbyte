<script lang="ts">
	interface Props {
		label: string;
		value: string | number;
	}

	let { label, value }: Props = $props();
</script>

<div class="flex items-center justify-between border-b border-gray-100 py-2">
	<span class="text-sm text-gray-600">{label}</span>
	<span class="text-sm font-medium text-gray-900">{value}</span>
</div>
