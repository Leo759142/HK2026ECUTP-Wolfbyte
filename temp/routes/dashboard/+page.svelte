<script lang="ts">
	import PageHeader from '#lib/components/PageHeader.svelte';
	import Card from '#lib/components/Card.svelte';
	import Badge from '#lib/components/Badge.svelte';
	import ProgressBar from '#lib/components/ProgressBar.svelte';
	import BarChart from '#lib/components/BarChart.svelte';
</script>

<PageHeader title="Dashboard" description="Overview of your application metrics" />

<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
	<Card>
		<div class="flex items-center justify-between">
			<span class="text-sm font-medium text-gray-600">Total Users</span>
			<Badge variant="success">+12%</Badge>
		</div>
		<div class="mt-2">
			<span class="text-3xl font-bold text-gray-900">2,845</span>
		</div>
	</Card>

	<Card>
		<div class="flex items-center justify-between">
			<span class="text-sm font-medium text-gray-600">Revenue</span>
			<Badge variant="success">+8%</Badge>
		</div>
		<div class="mt-2">
			<span class="text-3xl font-bold text-gray-900">$45,231</span>
		</div>
	</Card>

	<Card>
		<div class="flex items-center justify-between">
			<span class="text-sm font-medium text-gray-600">Conversion</span>
			<Badge variant="warning">-2%</Badge>
		</div>
		<div class="mt-2">
			<span class="text-3xl font-bold text-gray-900">3.2%</span>
		</div>
	</Card>

	<Card>
		<div class="flex items-center justify-between">
			<span class="text-sm font-medium text-gray-600">Active Now</span>
			<Badge variant="info">Live</Badge>
		</div>
		<div class="mt-2">
			<span class="text-3xl font-bold text-gray-900">142</span>
		</div>
	</Card>
</div>

<div class="mt-6 grid gap-6 lg:grid-cols-2">
	<Card>
		<h3 class="text-lg font-semibold text-gray-900">Traffic Sources</h3>
		<div class="mt-4">
			<BarChart
				data={[
					{ label: 'Direct', value: 4500 },
					{ label: 'Organic', value: 3200 },
					{ label: 'Social', value: 1800 },
					{ label: 'Referral', value: 900 }
				]}
				variant="primary"
			/>
		</div>
	</Card>

	<Card>
		<h3 class="text-lg font-semibold text-gray-900">Completion Progress</h3>
		<div class="mt-4 space-y-4">
			<div>
				<div class="flex justify-between text-sm mb-1">
					<span>Profile Setup</span>
					<span>100%</span>
				</div>
				<ProgressBar value={100} variant="success" />
			</div>
			<div>
				<div class="flex justify-between text-sm mb-1">
					<span>Team Invitations</span>
					<span>75%</span>
				</div>
				<ProgressBar value={75} variant="primary" />
			</div>
			<div>
				<div class="flex justify-between text-sm mb-1">
					<span>Payment Method</span>
					<span>50%</span>
				</div>
				<ProgressBar value={50} variant="warning" />
			</div>
			<div>
				<div class="flex justify-between text-sm mb-1">
					<span>Data Migration</span>
					<span>25%</span>
				</div>
				<ProgressBar value={25} variant="danger" />
			</div>
		</div>
	</Card>
</div>
