<script lang="ts">
	let { cols = 1, gap = '1rem', children } = $props();
</script>

<div class="responsive-grid" style="--cols: {cols}; --gap: {gap};">
	{@render children()}
</div>

<style>
	.responsive-grid {
		display: grid;
		grid-template-columns: repeat(var(--cols, 1), 1fr);
		gap: var(--gap, 1rem);
	}

	@media (min-width: 768px) {
		.responsive-grid {
			--cols: 3;
		}
	}

	@media (min-width: 1024px) {
		.responsive-grid {
			--cols: 4;
		}
	}

	@media (min-width: 1440px) {
		.responsive-grid {
			--cols: 5;
		}
	}
</style>