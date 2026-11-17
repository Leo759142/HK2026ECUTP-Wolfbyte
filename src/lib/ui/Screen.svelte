<script lang="ts">
	let { class: className = '', children = undefined } = $props();
</script>

<section class={`app-screen ${className}`}>{@render children?.()}</section>
