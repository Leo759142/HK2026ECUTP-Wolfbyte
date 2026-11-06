<script lang="ts">
	interface Props {
		src: string;
		alt: string;
		size?: 'sm' | 'md' | 'lg' | 'xl';
	}

	let { src, alt, size = 'md' }: Props = $props();

	const sizes = {
		sm: 'h-8 w-8 text-sm',
		md: 'h-10 w-10 text-base',
		lg: 'h-12 w-12 text-lg',
		xl: 'h-16 w-16 text-xl'
	};
</script>

<img
	{src}
	{alt}
	class={`${sizes[size]} rounded-full object-cover border-2 border-white shadow-sm`}
	loading="lazy"
/>
