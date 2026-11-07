<script lang="ts">
	import PageHeader from '#lib/components/PageHeader.svelte';
	import Card from '#lib/components/Card.svelte';
	import Button from '#lib/components/Button.svelte';
	import { theme } from '../lib/stores';
</script>

<PageHeader title="Settings" description="Configure your application preferences" />

<div class="grid gap-6 lg:grid-cols-2">
	<Card>
		<h3 class="text-lg font-semibold text-gray-900">Appearance</h3>
		<p class="mt-1 text-sm text-gray-600">Customize how the application looks</p>
		<div class="mt-4 flex items-center justify-between">
			<span class="text-sm text-gray-700">Dark Mode</span>
			<button
			 onclick={() => theme.update((t: 'light' | 'dark') => (t === 'light' ? 'dark' : 'light'))}
			 class="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
			 role="switch"
			 aria-checked={$theme === 'dark'}
			 aria-label="Toggle dark mode"
		>
			<span
				class={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
					$theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
				}`}
			></span>
		</button>
		</div>
	</Card>

	<Card>
		<h3 class="text-lg font-semibold text-gray-900">Notifications</h3>
		<p class="mt-1 text-sm text-gray-600">Manage your notification preferences</p>
		<div class="mt-4 space-y-3">
			<label class="flex items-center justify-between">
				<span class="text-sm text-gray-700">Email notifications</span>
				<input type="checkbox" class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" checked />
			</label>
			<label class="flex items-center justify-between">
				<span class="text-sm text-gray-700">Push notifications</span>
				<input type="checkbox" class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
			</label>
			<label class="flex items-center justify-between">
				<span class="text-sm text-gray-700">SMS alerts</span>
				<input type="checkbox" class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" checked />
			</label>
		</div>
	</Card>

	<Card>
		<h3 class="text-lg font-semibold text-gray-900">Account</h3>
		<p class="mt-1 text-sm text-gray-600">Manage your account settings</p>
		<div class="mt-4 flex flex-col gap-2">
			<Button variant="secondary" class="justify-start">
				Change Password
			</Button>
			<Button variant="danger" class="justify-start">
				Delete Account
			</Button>
		</div>
	</Card>

	<Card>
		<h3 class="text-lg font-semibold text-gray-900">About</h3>
		<p class="mt-1 text-sm text-gray-600">Application information</p>
		<div class="mt-4 space-y-2 text-sm">
			<div class="flex justify-between">
				<span class="text-gray-500">Version</span>
				<span class="font-medium text-gray-900">1.0.0</span>
			</div>
			<div class="flex justify-between">
				<span class="text-gray-500">Framework</span>
				<span class="font-medium text-gray-900">SvelteKit</span>
			</div>
			<div class="flex justify-between">
				<span class="text-gray-500">Build Tool</span>
				<span class="font-medium text-gray-900">Vite</span>
			</div>
		</div>
	</Card>
</div>