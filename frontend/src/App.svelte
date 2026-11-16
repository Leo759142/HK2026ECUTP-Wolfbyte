<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		conBarra?: boolean;
		header?: Snippet;
		children?: Snippet;
	}

	let { conBarra = false, header, children }: Props = $props();
</script>

<div class="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-crema shadow-[0_0_40px_rgba(15,76,92,.12)]">
	<header class="flex items-center px-5 pt-[max(0.75rem,env(safe-area-inset-top,0px))] text-tinta">
		{@render header?.()}
	</header>

	<main class="flex flex-1 flex-col {conBarra ? 'pb-[calc(7rem+env(safe-area-inset-bottom,0px))]' : ''}">
		{@render children?.()}
	</main>
</div>
