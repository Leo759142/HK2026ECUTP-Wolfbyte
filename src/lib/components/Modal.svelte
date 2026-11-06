<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
		title?: string;
		children: Snippet;
	}

	let { open, onClose, title, children }: Props = $props();
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center">
		<div
		 class="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
		 onclick={onClose}
		></div>
		<div class="relative mx-4 w-full max-w-lg transform rounded-lg bg-white p-6 shadow-xl">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-semibold text-gray-900">{title}</h3>
				<button
				 onclick={onClose}
				 class="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
				 aria-label="Close modal"
				>
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			<div class="mt-4">
				{@render children()}
			</div>
		</div>
	</div>
{/if}