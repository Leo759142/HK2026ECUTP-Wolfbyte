<script lang="ts">
	interface Props {
		label: string;
		href: string;
		active?: boolean;
	}

	let { label, href, active = false }: Props = $props();
</script>

<a
	{href}
	class={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
		active
			? 'bg-blue-100 text-blue-700'
			: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
	}`}
>
	{label}
</a>
