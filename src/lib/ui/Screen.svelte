<script lang="ts">
	let { class: className = '', children = undefined } = $props();
</script>

<div class={`mobile-screen ${className}`}>{@render children?.()}</div>
