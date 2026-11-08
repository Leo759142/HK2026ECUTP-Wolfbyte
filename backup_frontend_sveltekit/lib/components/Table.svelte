<script lang="ts">
	interface Column {
		key: string;
		label: string;
	}

	interface Props {
		columns: Column[];
		data: Record<string, any>[];
		onRowClick?: (row: Record<string, any>) => void;
		children?: any;
	}

	let { columns, data, onRowClick, children }: Props = $props();
</script>

<div class="overflow-x-auto rounded-lg border border-gray-200">
	<table class="min-w-full divide-y divide-gray-200">
		<thead class="bg-gray-50">
			<tr>
				{#each columns as col}
					<th
						class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
					>
						{col.label}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-200 bg-white">
			{#each data as row (row.id || JSON.stringify(row))}
				<tr
				 class={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
				 onclick={() => onRowClick?.(row)}
				>
					{#each columns as col}
						<td class="px-6 py-4 text-sm">
							{#if children}
								{@render children(row, col)}
							{:else}
								<span class="text-gray-700">{row[col.key] || '-'}</span>
							{/if}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>