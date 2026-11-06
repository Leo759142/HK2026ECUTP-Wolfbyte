<script lang="ts">
	interface Props {
		title: string;
		description?: string;
	}

	let { title, description }: Props = $props();
</script>

<svelte:head>
	<title>{title}</title>
	{#if description}
		<meta name="description" content={description} />
	{/if}
</svelte:head>

<header class="mb-8">
	<h1 class="text-3xl font-bold text-gray-900">{title}</h1>
	{#if description}
		<p class="mt-2 text-gray-600">{description}</p>
	{/if}
</header>
