<script lang="ts">
	let { children, padding = 'normal' } = $props();
</script>

<div class="card-responsive" data-padding={padding}>
	{@render children()}
</div>

<style>
	.card-responsive {
		background: #fff;
		border: 1px solid #ddd;
		border-radius: 12px;
		overflow: hidden;
	}

	.card-responsive[data-padding="normal"] {
		padding: var(--space-4);
	}

	.card-responsive[data-padding="compact"] {
		padding: var(--space-2);
	}

	@media (min-width: 768px) {
		.card-responsive[data-padding="normal"] {
			padding: var(--space-6);
		}
	}
</style>