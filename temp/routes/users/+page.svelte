<script lang="ts">
	import PageHeader from '#lib/components/PageHeader.svelte';
	import Card from '#lib/components/Card.svelte';
	import Table from '#lib/components/Table.svelte';
	import Badge from '#lib/components/Badge.svelte';
	import Button from '#lib/components/Button.svelte';
	import Avatar from '#lib/components/Avatar.svelte';

	const users = [
		{ id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin', status: 'Active' },
		{ id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'User', status: 'Active' },
		{ id: 3, name: 'Carol White', email: 'carol@example.com', role: 'Moderator', status: 'Pending' },
		{ id: 4, name: 'David Brown', email: 'david@example.com', role: 'User', status: 'Banned' },
		{ id: 5, name: 'Eva Davis', email: 'eva@example.com', role: 'User', status: 'Active' }
	];

	const columns = [
		{ key: 'name', label: 'Name' },
		{ key: 'email', label: 'Email' },
		{ key: 'role', label: 'Role' },
		{ key: 'status', label: 'Status' }
	];
</script>

<PageHeader title="Users" description="Manage your users and their permissions" />

<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
	<Card>
		<span class="text-sm font-medium text-gray-600">Total Users</span>
		<div class="mt-2">
			<span class="text-3xl font-bold text-gray-900">2,845</span>
		</div>
	</Card>
	<Card>
		<span class="text-sm font-medium text-gray-600">Active</span>
		<div class="mt-2">
			<span class="text-3xl font-bold text-green-600">2,412</span>
		</div>
	</Card>
	<Card>
		<span class="text-sm font-medium text-gray-600">Pending</span>
		<div class="mt-2">
			<span class="text-3xl font-bold text-yellow-600">312</span>
		</div>
	</Card>
	<Card>
		<span class="text-sm font-medium text-gray-600">Banned</span>
		<div class="mt-2">
			<span class="text-3xl font-bold text-red-600">121</span>
		</div>
	</Card>
</div>

<Card class="mt-6">
	<div class="mb-4 flex items-center justify-between">
		<h3 class="text-lg font-semibold text-gray-900">User List</h3>
		<Button variant="primary">Add User</Button>
	</div>
	<Table {columns} data={users}>
		{#snippet children(row: any, col: any)}
			{#if col.key === 'name'}
				<div class="flex items-center gap-3">
					<Avatar src={`https://i.pravatar.cc/150?u=${row.id}`} alt={row.name} size="sm" />
					<span class="font-medium text-gray-900">{row.name}</span>
				</div>
			{:else if col.key === 'status'}
				{#if row.status === 'Active'}
					<Badge variant="success">{row.status}</Badge>
				{:else if row.status === 'Pending'}
					<Badge variant="warning">{row.status}</Badge>
				{:else}
					<Badge variant="error">{row.status}</Badge>
				{/if}
			{:else if col.key === 'role'}
				{#if row.role === 'Admin'}
					<Badge variant="info">{row.role}</Badge>
				{:else if row.role === 'Moderator'}
					<Badge variant="primary">{row.role}</Badge>
				{:else}
					<span class="text-gray-700">{row.role}</span>
				{/if}
			{:else}
				<span class="text-gray-700">{row[col.key]}</span>
			{/if}
		{/snippet}
	</Table>
</Card>