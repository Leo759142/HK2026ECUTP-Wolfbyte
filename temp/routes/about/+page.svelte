<script lang="ts">
	import PageHeader from '#lib/components/PageHeader.svelte';
	import Card from '#lib/components/Card.svelte';
	import Badge from '#lib/components/Badge.svelte';
</script>

<PageHeader title="About This App" description="Learn more about our SvelteKit application" />

<div class="grid gap-6 lg:grid-cols-3">
	<Card>
		<div class="flex items-center gap-3">
			<div class="rounded-lg bg-blue-100 p-3">
				<svg class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-4m0 4l-4-4M14 4l-4 4m0-4l4 4" />
				</svg>
			</div>
			<h3 class="text-lg font-semibold text-gray-900">Modern Stack</h3>
		</div>
		<p class="mt-2 text-gray-600">
			Built with SvelteKit, Tailwind CSS, and TypeScript for a modern development experience.
		</p>
	</Card>

	<Card>
		<div class="flex items-center gap-3">
			<div class="rounded-lg bg-green-100 p-3">
				<svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
				</svg>
			</div>
			<h3 class="text-lg font-semibold text-gray-900">Performance</h3>
		</div>
		<p class="mt-2 text-gray-600">
			Optimized for speed with automatic code splitting and lazy loading.
		</p>
	</Card>

	<Card>
		<div class="flex items-center gap-3">
			<div class="rounded-lg bg-purple-100 p-3">
				<svg class="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			</div>
			<h3 class="text-lg font-semibold text-gray-900">Rapid Development</h3>
		</div>
		<p class="mt-2 text-gray-600">
			Reactive state management and hot module replacement for fast iteration.
		</p>
	</Card>
</div>

<Card class="mt-6">
	<h3 class="text-lg font-semibold text-gray-900">Tech Stack</h3>
	<div class="mt-4 flex flex-wrap gap-2">
		<Badge variant="info">Svelte 5</Badge>
		<Badge variant="info">SvelteKit</Badge>
		<Badge variant="success">TypeScript</Badge>
		<Badge variant="warning">Tailwind CSS</Badge>
		<Badge variant="default">Vite</Badge>
		<Badge variant="default">Vitest</Badge>
	</div>
</Card>
