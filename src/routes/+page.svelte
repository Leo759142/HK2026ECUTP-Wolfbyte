<script lang="ts">
	import Button from '#lib/components/Button.svelte';
	import Card from '#lib/components/Card.svelte';
	import Badge from '#lib/components/Badge.svelte';
	import ProgressBar from '#lib/components/ProgressBar.svelte';
</script>

<svelte:head>
	<title>Home - SvelteApp</title>
	<meta name="description" content="A modern SvelteKit application" />
</svelte:head>

<div class="space-y-8">
	<!-- Hero section -->
	<div class="text-center">
		<h1 class="text-4xl font-bold text-gray-900 sm:text-5xl">
			Welcome to <span class="text-blue-600">SvelteApp</span>
		</h1>
		<p class="mt-4 text-xl text-gray-600">
			A modern, fast, and fully-featured application built with SvelteKit
		</p>
		<div class="mt-8 flex justify-center gap-4">
			<Button variant="primary" size="lg" href="/dashboard">
				Open Dashboard
			</Button>
			<Button variant="secondary" size="lg" href="/about">
				Learn More
			</Button>
		</div>
	</div>

	<!-- Features grid -->
	<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
		<Card>
			<div class="flex items-center gap-3">
				<div class="rounded-lg bg-blue-100 p-3">
					<svg class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
					</svg>
				</div>
				<h3 class="text-lg font-semibold text-gray-900">Lightning Fast</h3>
			</div>
			<p class="mt-2 text-gray-600">
				Built with Svelte's reactive runtime for optimal performance.
			</p>
		</Card>

		<Card>
			<div class="flex items-center gap-3">
				<div class="rounded-lg bg-green-100 p-3">
					<svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<h3 class="text-lg font-semibold text-gray-900">Type Safe</h3>
			</div>
			<p class="mt-2 text-gray-600">
				Full TypeScript support with end-to-end type safety.
			</p>
		</Card>

		<Card>
			<div class="flex items-center gap-3">
				<div class="rounded-lg bg-purple-100 p-3">
					<svg class="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a9 9 0 01-12.57 8.86L5 21m14-8v8m-14-8a9 9 0 0112.57-8.86L19 13m-7 7l-7-7" />
					</svg>
				</div>
				<h3 class="text-lg font-semibold text-gray-900">SEO Friendly</h3>
			</div>
			<p class="mt-2 text-gray-600">
				SSR and SSG support for maximum search engine visibility.
			</p>
		</Card>
	</div>

	<!-- Demo section -->
	<div class="grid gap-6 lg:grid-cols-2">
		<Card>
			<h3 class="text-lg font-semibold text-gray-900">Progress Bars</h3>
			<p class="mt-1 text-sm text-gray-600">See our progress bar components in action</p>
			<div class="mt-4 space-y-4">
				<div>
					<div class="flex justify-between text-sm mb-1">
						<span>Design</span>
						<span>75%</span>
					</div>
					<ProgressBar value={75} variant="primary" />
				</div>
				<div>
					<div class="flex justify-between text-sm mb-1">
						<span>Development</span>
						<span>60%</span>
					</div>
					<ProgressBar value={60} variant="success" />
				</div>
				<div>
					<div class="flex justify-between text-sm mb-1">
						<span>Testing</span>
						<span>30%</span>
					</div>
					<ProgressBar value={30} variant="warning" />
				</div>
			</div>
		</Card>

		<Card>
			<h3 class="text-lg font-semibold text-gray-900">Badges</h3>
			<p class="mt-1 text-sm text-gray-600">Various badge styles</p>
			<div class="mt-4 flex flex-wrap gap-2">
				<Badge variant="default">Default</Badge>
				<Badge variant="success">Success</Badge>
				<Badge variant="warning">Warning</Badge>
				<Badge variant="error">Error</Badge>
				<Badge variant="info">Info</Badge>
			</div>
		</Card>
	</div>
</div>
