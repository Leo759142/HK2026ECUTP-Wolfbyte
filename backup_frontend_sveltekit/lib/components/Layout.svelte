<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	const navigation = [
		{ label: 'Home', href: '/' },
		{ label: 'About', href: '/about' },
		{ label: 'Dashboard', href: '/dashboard' },
		{ label: 'Settings', href: '/settings' }
	];

	let currentPath = $state('');

	afterNavigate(({ to }) => {
		currentPath = to?.url.pathname ?? currentPath;
	});
</script>

<div class="min-h-screen bg-gray-50">
	<nav class="border-b border-gray-200 bg-white">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex h-16 items-center justify-between">
				<div class="flex items-center">
					<a href="/" class="flex items-center gap-2">
						<div class="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
							S
						</div>
						<span class="text-xl font-bold text-gray-900">SvelteApp</span>
					</a>
				</div>
				<div class="flex items-center gap-1">
					{#each navigation as item}
						<a
							href={item.href}
							class={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
								currentPath === item.href
									? 'bg-blue-100 text-blue-700'
									: 'text-gray-700 hover:bg-gray-100'
							}`}
						>
							{item.label}
						</a>
					{/each}
				</div>
			</div>
		</div>
	</nav>

	<main class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
		{@render children()}
	</main>

	<footer class="border-t border-gray-200 bg-white mt-12">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
			<p class="text-center text-sm text-gray-500">
				&copy; {new Date().getFullYear()} SvelteApp. Built with SvelteKit.
			</p>
		</div>
	</footer>
</div>